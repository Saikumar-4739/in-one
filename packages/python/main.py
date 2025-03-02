from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
import os
import torch
from transformers import pipeline
import uvicorn

# Initialize FastAPI
app = FastAPI()

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/in-one")
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_database()

# Load AI Models
auto_reply_model = pipeline("text-generation", model="gpt2")
summary_model = pipeline("summarization")

# Models
class AutoReply(BaseModel):
    userId: str
    messageId: str
    suggestedReplies: List[str]
    selectedReply: Optional[str] = None

class ChatSummary(BaseModel):
    chatId: str
    userId: str
    summaryText: str
    keywords: List[str] = []

# Routes
@app.get("/")
def read_root():
    return {"message": "Hello, Welcome to In-One!"}

@app.post("/auto-replies/")
async def generate_auto_reply(auto_reply: AutoReply):
    generated = auto_reply_model(auto_reply.suggestedReplies[0], max_length=50, num_return_sequences=3)
    replies = [gen['generated_text'] for gen in generated]
    auto_reply.suggestedReplies = replies
    result = await db.auto_replies.insert_one(auto_reply.dict())
    return {"id": str(result.inserted_id), "suggestedReplies": replies}

@app.get("/auto-replies/{message_id}")
async def fetch_auto_replies(message_id: str):
    results = await db.auto_replies.find({"messageId": message_id}).to_list(None)
    return results

@app.delete("/auto-replies/{reply_id}")
async def delete_auto_reply(reply_id: str):
    result = await db.auto_replies.delete_one({"_id": reply_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reply not found")
    return {"message": "Deleted successfully"}

@app.post("/chat-summary/")
async def generate_chat_summary(chat: ChatSummary):
    summary = summary_model(chat.summaryText, max_length=100, min_length=30, do_sample=False)
    chat.summaryText = summary[0]['summary_text']
    result = await db.chat_summaries.insert_one(chat.dict())
    return {"id": str(result.inserted_id), "summaryText": chat.summaryText}

# Run the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)