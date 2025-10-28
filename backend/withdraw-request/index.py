import json
import os
import psycopg2
from typing import Dict, Any
import urllib.request
import urllib.parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle withdrawal requests and send Telegram notifications to admin
    Args: event with httpMethod, body
    Returns: HTTP response with withdrawal ID
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    user_name = body_data.get('userName')
    user_email = body_data.get('userEmail')
    amount = body_data.get('amount')
    phone_number = body_data.get('phoneNumber')
    bank_name = body_data.get('bankName')
    
    if not all([user_name, user_email, amount, phone_number, bank_name]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO withdrawals (user_name, user_email, amount, phone_number, bank_name, status) "
        "VALUES (%s, %s, %s, %s, %s, 'pending') RETURNING id",
        (user_name, user_email, amount, phone_number, bank_name)
    )
    withdrawal_id = cur.fetchone()[0]
    conn.commit()
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
    
    if bot_token and chat_id:
        message = (
            f"🔔 <b>Новая заявка на вывод #{withdrawal_id}</b>\n\n"
            f"👤 Пользователь: {user_name}\n"
            f"📧 Email: {user_email}\n"
            f"💰 Сумма: {amount}₽\n"
            f"📱 Телефон СБП: {phone_number}\n"
            f"🏦 Банк: {bank_name}\n\n"
            f"Для управления используйте команды:\n"
            f"/approve_{withdrawal_id} - Одобрить\n"
            f"/reject_{withdrawal_id} - Отклонить"
        )
        
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        data = urllib.parse.urlencode({
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }).encode()
        
        try:
            req = urllib.request.Request(url, data=data)
            urllib.request.urlopen(req)
        except Exception as e:
            print(f"Telegram notification failed: {e}")
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'withdrawalId': withdrawal_id,
            'message': 'Withdrawal request created'
        }),
        'isBase64Encoded': False
    }