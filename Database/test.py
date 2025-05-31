import pymysql
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_mysql_connection():
    try:
        connection = pymysql.connect( 
            host='sql7.freesqldatabase.com',
            user='sql7782165',
            password='dHXjmnpkuc',
            database='sql7782165',
            port=3306
        )
        
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            result = cursor.fetchone()
            logger.info(f"Test query result: {result}")
            
        connection.close()
        logger.info("✅ Database connection successful!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_mysql_connection()