from flask import Flask
from threading import Thread
import bot

t = Thread(target=bot.run)
t.start()

app = Flask("FunBot")


@app.route("/")
def home():
    return "Home route"
