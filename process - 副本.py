from pandas import DataFrame
import pandas as pd
import os
import pymysql
import random
import csv

DB_HOST="localhost"
DB_USER="inventory_user"
DB_PASSWORD="Y-0000:)"
DB_NAME="consumable_asset_management"
DB_PORT=3306

DB_CONFIG = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME,
    'port': DB_PORT,
    'charset': 'utf8mb4',
}

# 假设 category_id 需要你自己查表或映射，这里暂时用固定值
CATEGORY_ID_MAP = {
    '玻璃仪器': 1,
    '专用物耗': 2,
    '备品配件': 3,
    '专用工具': 4,
    '常规化学品': 5,
    '危险化学品': 6,
    '标准物质': 7,
    '实验气体': 8,
}
def process_csv_asset(csv_path):
    df = pd.read_csv(csv_path, encoding='utf-8-sig', sep=',')
    df.columns = df.columns.str.strip()
    print("表头：", df.columns.tolist())
    assets = []
    for _, row in df.iterrows():
        name = str(row.get('消耗性资产名称', '')).strip()
        if not name or name == 'nan':
            continue
        category_name = str(row.get('名称', '')).strip()
        category_id = CATEGORY_ID_MAP.get(category_name, None)
        asset = {
            'name': name,
            'category_id': category_id,
            'brand': '' if pd.isna(row.get('商家/厂家/品牌', '')) else str(row.get('商家/厂家/品牌', '')).strip(),
            'model': '' if pd.isna(row.get('规格型号', '')) else str(row.get('规格型号', '')).strip(),
            'unit': '' if pd.isna(row.get('入库单位', '')) else str(row.get('入库单位', '')).strip(),
            'requirement': '' if pd.isna(row.get('领用要求', '')) else str(row.get('领用要求', '')).strip(),
            'is_active': 1,
        }
        assets.append(asset)
    return assets

def process_csv_location(file_path):
    df = pd.read_csv(file_path, encoding='utf-8-sig', sep=',')
    df.columns = df.columns.str.strip()
    locations = set()
    for _, row in df.iterrows():
        room = str(row.get('房间名称', '')).strip()
        cabinet = str(row.get('箱柜屉架', '')).strip()
        shelf = str(row.get('隔板层数', '')).strip()
        if not (room or cabinet or shelf):
            continue
        # 只要有一项就算一个location
        locations.add((room, cabinet, shelf))
    return list(locations)

def process_csv_batch(file_path):
    df = pd.read_csv(file_path, encoding='utf-8-sig', sep=',')
    df.columns = df.columns.str.strip()
    batches = []
    for _, row in df.iterrows():
        asset_name = str(row.get('消耗性资产名称', '')).strip()
        if not asset_name or asset_name == 'nan':
            continue
        batch = {
            'asset_name': asset_name,
            'batch_serial': '' if pd.isna(row.get('批号/编号/标识', '')) else str(row.get('批号/编号/标识', '')).strip(),
            'expiration_date': None if pd.isna(row.get('有效期至', None)) else str(row.get('有效期至', None)).strip(),
            'location_room': str(row.get('房间名称', '')).strip(),
            'location_cabinet': str(row.get('箱柜屉架', '')).strip(),
            'location_shelf': str(row.get('隔板层数', '')).strip(),
            "remaining_quantity": 0 if pd.isna(row.get('库存数量', 0)) else int(row.get('库存数量', 0)),
            'remarks': '；'.join([str(row.get(col, '')).strip() for col in ['批次备注','备注说明1','备注说明2'] if str(row.get(col, '')).strip() and str(row.get(col, '')).strip() != 'nan'])
        }
        batches.append(batch)
    return batches

def safe_float(val, default=0):
    try:
        s = str(val).strip()
        if not s or s.lower() == 'nan':
            return default
        return float(s)
    except Exception:
        return default

def process_csv_inbound(file_path):
    df = pd.read_csv(file_path, encoding='utf-8-sig', sep=',')
    df.columns = df.columns.str.strip()
    inbounds = []
    for _, row in df.iterrows():
        asset_name = str(row.get('消耗性资产名称', '')).strip()
        if not asset_name or asset_name == 'nan':
            continue
        inbound = {
            'asset_name': asset_name,
            "source_desc": '' if pd.isna(row.get('来源', '')) else str(row.get('来源', '')).strip(),
            'quantity': safe_float(row.get('入库总量', 0)),
            'source': '' if pd.isna(row.get('验检入库编号', '')) else str(row.get('验检入库编号', '')).strip(),
            'remarks': '；'.join([str(row.get(col, '')).strip() for col in ['入库备注','备注说明1','备注说明2'] if str(row.get(col, '')).strip() and str(row.get(col, '')).strip() != 'nan'])
        }
        inbounds.append(inbound)
    return inbounds

def process_csv_outbound(file_path):
    df = pd.read_csv(file_path, encoding='utf-8-sig', sep=',')
    df.columns = df.columns.str.strip()
    outbounds = []
    for _, row in df.iterrows():
        asset_name = str(row.get('消耗性资产名称', '')).strip()
        if not asset_name or asset_name == 'nan':
            continue        
        if(safe_float(row.get('出库数量', 0))==0):
            continue
        outbound = {
            'asset_name': asset_name,
            'quantity': safe_float(row.get('出库数量', 0)),
            'destination': '' if pd.isna(row.get('领用出库编号', '')) else str(row.get('领用出库编号', '')).strip(),
            'remarks': '；'.join([str(row.get(col, '')).strip() for col in ['出库备注','备注说明1','备注说明2'] if str(row.get(col, '')).strip() and str(row.get(col, '')).strip() != 'nan'])
        }
        outbounds.append(outbound)
    return outbounds

def fix_date(date_str):
    if not date_str or date_str == 'nan':
        return None
    # 去除前后空格和逗号
    date_str = str(date_str).strip().replace(',', '')
    # 如果是 YYYY.MM.DD 格式，转为 YYYY-MM-DD
    if '.' in date_str:
        parts = date_str.split('.')
        if len(parts) == 3 and all(p.isdigit() for p in parts):
            return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
    return date_str  # 其他格式原样返回



# 用资产详细信息匹配 asset_id
def get_asset_id_by_info(cursor, asset_name, brand, model, unit):
    search_query = "SELECT asset_id FROM dim_asset_definition WHERE name=%s"
    search_params = [asset_name]
    if brand:
        search_query += " AND brand=%s"
        search_params.append(brand)
    if model:
        search_query += " AND model=%s"
        search_params.append(model)
    cursor.execute(search_query, tuple(search_params))
    asset = cursor.fetchone()
    return asset[0] if asset else None

# 用 asset_id, location_id, expiry_date 匹配 batch_id
def get_batch_id_by_info(cursor, asset_id, location_id, expiry_date):
    search_query = "SELECT batch_id FROM fact_stock_batch WHERE asset_id=%s"
    search_params = [asset_id]
    if location_id is not None:
        search_query += " AND location_id=%s"
        search_params.append(location_id)
    if expiry_date is not None:
        search_query += " AND expiry_date=%s"
        search_params.append(expiry_date)
    cursor.execute(search_query + " ORDER BY batch_id DESC LIMIT 1", tuple(search_params))
    batch = cursor.fetchone()
    return batch[0] if batch else None

def safe_str(val, maxlen=512):
    s = str(val) if val is not None else ''
    return s[:maxlen]


if __name__ == '__main__':
    # 入库登记
    inbounds = process_csv_inbound('clean1.csv')
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    for inbound in inbounds:
        # 资产详细信息（需保证 inbound 里有 brand/model/unit 字段，若无可补充）
        asset_name = inbound['asset_name']
        brand = inbound.get('brand', '')
        model = inbound.get('model', '')
        unit = inbound.get('unit', '')
        asset_id = get_asset_id_by_info(cursor, asset_name, brand, model, unit)
        if asset_id is None:
            print(f"未找到资产: {asset_name}, {brand}, {model}, {unit}")
            continue
        # 位置信息（如有）
        location_room = inbound.get('location_room', '')
        location_cabinet = inbound.get('location_cabinet', '')
        location_shelf = inbound.get('location_shelf', '')
        location_id = None
        if location_room or location_cabinet or location_shelf:
            cursor.execute(
                "SELECT location_id FROM dim_location WHERE room=%s AND cabinet=%s AND shelf=%s",
                (location_room, location_cabinet, location_shelf)
            )
            loc = cursor.fetchone()
            location_id = loc[0] if loc else None
        # 有效期
        expiry_date = fix_date(inbound.get('expiration_date', None))
        # 匹配 batch_id
        batch_id = get_batch_id_by_info(cursor, asset_id, location_id, expiry_date)
        if batch_id is None:
            print(f"未找到批次: asset_id={asset_id}, location_id={location_id}, expiry_date={expiry_date}")
            continue
        operator_id = random.choice([7, 8])
        sql = """
            INSERT INTO fact_inbound_log
            (batch_id, source, quantity, operator_id, remarks, source_desc)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (
            batch_id,
            safe_str(inbound.get('source', ''), 512),  # 截断
            inbound['quantity'],
            operator_id,
            inbound['remarks'],
            inbound.get('source_desc', '')
        )
        # cursor.execute(sql, values)

    # 出库登记
    outbounds = process_csv_outbound('clean1.csv')
    for outbound in outbounds:
        asset_name = outbound['asset_name']
        brand = outbound.get('brand', '')
        model = outbound.get('model', '')
        unit = outbound.get('unit', '')
        asset_id = get_asset_id_by_info(cursor, asset_name, brand, model, unit)
        if asset_id is None:
            print(f"未找到资产: {asset_name}, {brand}, {model}, {unit}")
            continue
        location_room = outbound.get('location_room', '')
        location_cabinet = outbound.get('location_cabinet', '')
        location_shelf = outbound.get('location_shelf', '')
        location_id = None
        if location_room or location_cabinet or location_shelf:
            cursor.execute(
                "SELECT location_id FROM dim_location WHERE room=%s AND cabinet=%s AND shelf=%s",
                (location_room, location_cabinet, location_shelf)
            )
            loc = cursor.fetchone()
            location_id = loc[0] if loc else None
        expiry_date = fix_date(outbound.get('expiration_date', None))
        batch_id = get_batch_id_by_info(cursor, asset_id, location_id, expiry_date)
        if batch_id is None:
            print(f"未找到批次: asset_id={asset_id}, location_id={location_id}, expiry_date={expiry_date}")
            continue
        operator_id = random.choice([7, 8])
        sql = """
            INSERT INTO fact_outbound_log
            (batch_id, destination, quantity, operator_id, remarks)
            VALUES (%s, %s, %s, %s, %s)
        """
        values = (
            batch_id,
            safe_str(outbound.get('destination', ''), 255),  # 截断
            outbound['quantity'],
            operator_id,
            outbound['remarks']
        )
        cursor.execute(sql, values)

    conn.commit()
    cursor.close()
    conn.close()
    print("全部入库/出库登记完成！")
