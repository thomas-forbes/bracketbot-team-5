# this file will take a picture using a realsense camera and send it to a storage
# call take_picture() from main.py -> encode -> send to gpt
import boto3
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

def take_picture():
    pass

#take example image upload to s3 -> return image url
def upload_to_s3(image_path):
    """
    Upload image to S3 using environment variables for credentials
    """
    try:
        # Create S3 client - boto3 will automatically use AWS_* environment variables
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            # aws_session_token=os.getenv('AWS_SESSION_TOKEN')
        )
        bucket_name = os.getenv('AWS_BUCKET_NAME')  # Get bucket from env var
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        s3_key = f"robot_images/{timestamp}.png"
        
        print(f"Uploading {image_path} to S3...")
        s3_client.upload_file(
            Filename=image_path,    # Local file
            Bucket=bucket_name,     # S3 bucket name
            Key=s3_key             # S3 object name
        )
        
        # Generate URL
        url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key
            },
            ExpiresIn=3600
        )
        
        return url
        
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None


