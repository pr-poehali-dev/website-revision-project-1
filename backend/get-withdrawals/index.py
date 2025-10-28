import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get all withdrawal requests for admin panel
    Args: event with httpMethod, queryStringParameters
    Returns: HTTP response with withdrawals list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    admin_key = headers.get('x-admin-key') or headers.get('X-Admin-Key')
    
    if admin_key != 'admin123':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    status_filter = query_params.get('status', 'all')
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    if status_filter == 'all':
        cur.execute(
            "SELECT id, user_name, user_email, amount, card_number, bank_name, status, "
            "created_at, updated_at FROM withdrawals ORDER BY created_at DESC"
        )
    else:
        cur.execute(
            "SELECT id, user_name, user_email, amount, card_number, bank_name, status, "
            "created_at, updated_at FROM withdrawals WHERE status = %s ORDER BY created_at DESC",
            (status_filter,)
        )
    
    rows = cur.fetchall()
    
    withdrawals = []
    for row in rows:
        withdrawals.append({
            'id': row[0],
            'userName': row[1],
            'userEmail': row[2],
            'amount': float(row[3]),
            'cardNumber': row[4],
            'bankName': row[5],
            'status': row[6],
            'createdAt': row[7].isoformat() if row[7] else None,
            'updatedAt': row[8].isoformat() if row[8] else None,
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'withdrawals': withdrawals,
            'total': len(withdrawals)
        }),
        'isBase64Encoded': False
    }
