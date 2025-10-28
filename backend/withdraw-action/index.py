import json
import os
import psycopg2
from typing import Dict, Any
import urllib.request
import urllib.parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Telegram bot webhook to approve/reject withdrawals
    Args: event with httpMethod, body (Telegram update)
    Returns: HTTP response
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
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    if 'message' not in body_data:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    message = body_data['message']
    text = message.get('text', '')
    chat_id = message['chat']['id']
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    admin_chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
    
    if str(chat_id) != str(admin_chat_id):
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if text.startswith('/approve_') or text.startswith('/reject_'):
        action = 'approved' if text.startswith('/approve_') else 'rejected'
        withdrawal_id = text.split('_')[1]
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(
            "SELECT user_name, user_email, amount, card_number, bank_name FROM withdrawals WHERE id = %s",
            (withdrawal_id,)
        )
        result = cur.fetchone()
        
        if result:
            user_name, user_email, amount, card_number, bank_name = result
            
            cur.execute(
                "UPDATE withdrawals SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (action, withdrawal_id)
            )
            conn.commit()
            
            status_emoji = '✅' if action == 'approved' else '❌'
            status_text = 'одобрена' if action == 'approved' else 'отклонена'
            
            response_message = (
                f"{status_emoji} <b>Заявка #{withdrawal_id} {status_text}</b>\n\n"
                f"👤 {user_name}\n"
                f"💰 {amount}₽ → *{card_number[-4:]} ({bank_name})"
            )
            
            url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            data = urllib.parse.urlencode({
                'chat_id': chat_id,
                'text': response_message,
                'parse_mode': 'HTML'
            }).encode()
            
            req = urllib.request.Request(url, data=data)
            urllib.request.urlopen(req)
        
        cur.close()
        conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True}),
        'isBase64Encoded': False
    }
