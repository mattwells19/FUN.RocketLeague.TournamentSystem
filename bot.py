from discord.ext.commands import Bot
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from os import getenv

loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)


load_dotenv()
client = Bot(command_prefix="-")


def run():
    client.run(getenv("DISCORD_TOKEN"))


@client.event
async def on_ready():
    with open("log.txt", "a") as log:
        log.write("\nBot has started - " +
                  datetime.today().strftime("%d/%m/%Y %H:%M:%S"))


@client.command(name="quit")
async def quit_app(ctx):
    await client.logout()
    loop.stop()


@client.command(name="team")
async def team(ctx):
    await ctx.send("Hi")
