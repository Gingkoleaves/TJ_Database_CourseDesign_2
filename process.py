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
            "brand": '' if pd.isna(row.get('商家/厂家/品牌', '')) else str(row.get('商家/厂家/品牌', '')).strip(),
            "model": '' if pd.isna(row.get('规格型号', '')) else str(row.get('规格型号', '')).strip(),
            "unit": '' if pd.isna(row.get('入库单位', '')) else str(row.get('入库单位', '')).strip(),
            'location_room': str(row.get('房间名称', '')).strip(),
            'location_cabinet': str(row.get('箱柜屉架', '')).strip(),
            'location_shelf': str(row.get('隔板层数', '')).strip(),
            "remaining_quantity": 0 if pd.isna(row.get('库存数量', 0)) else int(row.get('库存数量', 0)),
            'remarks': '；'.join([str(row.get(col, '')).strip() for col in ['批次备注','备注说明1','备注说明2'] if str(row.get(col, '')).strip() and str(row.get(col, '')).strip() != 'nan'])
        }
        batches.append(batch)
    return batches

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
            'quantity': 0 if pd.isna(row.get('验检入库数量', 0)) else int(row.get('验检入库数量', 0)),
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
        outbound = {
            'asset_name': asset_name,
            'quantity': 0 if pd.isna(row.get('领用出库数量', 0)) else int(row.get('领用出库数量', 0)),
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


def get_batch_id(cursor, asset_name, batch_serial):
    # 先查 asset_id
    cursor.execute("SELECT asset_id FROM dim_asset_definition WHERE name=%s", (asset_name,))
    asset = cursor.fetchone()
    asset_id = asset[0] if asset else None
    if asset_id is None:
        return None
    # 再查 batch_id
    cursor.execute(
        "SELECT batch_id FROM fact_stock_batch WHERE asset_id=%s AND batch_serial=%s",
        (asset_id, batch_serial)
    )
    batch = cursor.fetchone()
    return batch[0] if batch else None


if __name__ == '__main__':
    """
    assets = process_csv_asset('clean1.csv')
    # 连接数据库
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    for asset in assets:
        print(asset)
        sql = (
            "INSERT IGNORE INTO dim_asset_definition (name, category_id, brand, model, unit, requirement, is_active) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s);"
        )
        values = (
            asset['name'],
            asset['category_id'],
            asset['brand'],
            asset['model'],
            asset['unit'],
            asset['requirement'],
            asset['is_active']
        )
        cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    print("全部资产插入完成！")
    # 位置导入示例
    locations = process_csv_location('clean1.csv')
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    for room, cabinet, shelf in locations:
        print({'room': room, 'cabinet': cabinet, 'shelf': shelf})
        sql = (
            "INSERT IGNORE INTO dim_location (room, cabinet, shelf) VALUES (%s, %s, %s);"
        )
        values = (room, cabinet, shelf)
        cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    print("全部位置插入完成！")
    """
    batches = process_csv_batch('clean1.csv')
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    for batch in batches:
        # 查 asset_id
        # 如果brand和model有值，则一并作为筛选条件
        search_query = "SELECT asset_id FROM dim_asset_definition WHERE name=%s"
        search_params = [batch['asset_name']]
        if batch['brand']:
            search_query += " AND brand=%s"
            search_params.append(batch['brand'])
        if batch['model']:
            search_query += " AND model=%s"
            search_params.append(batch['model'])
        cursor.execute(search_query, tuple(search_params))
        asset = cursor.fetchone()
        asset_id = asset[0] if asset else None
        if asset_id is None:
            print(f"未找到资产: {batch['asset_name']}")

        cursor.execute(
            "SELECT location_id FROM dim_location WHERE room=%s AND cabinet=%s AND shelf=%s",
            (batch['location_room'], batch['location_cabinet'], batch['location_shelf'])
        )
        location = cursor.fetchone()
        location_id = location[0] if location else None
        if location_id is None:
            print(f"未找到位置: {batch['location_room']}, {batch['location_cabinet']}, {batch['location_shelf']}")        # 插入 fact_stock_batch
        expiry_date = fix_date(batch['expiration_date'])

        # 插入 fact_stock_batch
        sql = """
            INSERT INTO fact_stock_batch
            (asset_id, location_id, batch_serial, expiry_date, current_quantity, remarks)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (
            asset_id,
            location_id,
            batch['batch_serial'],
            expiry_date,
            batch['remaining_quantity'],
            batch['remarks']
        )
        # print(values)
        cursor.execute(sql, values)

    conn.commit()
    cursor.close()
    conn.close()
    print("全部批次数据插入完成！")

