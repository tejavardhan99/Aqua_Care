import paho.mqtt.client as mqtt
import time
import json

BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC = "prawnagent/pond01/state"

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"Connected to HiveMQ broker with code {rc}")
    client.subscribe(TOPIC)
    print(f"Subscribed to topic: {TOPIC}")

def on_message(client, userdata, msg):
    print(f"Received message on {msg.topic}: {msg.payload.decode('utf-8', errors='ignore')}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print(f"Connecting to {BROKER}:{PORT}...")
client.connect(BROKER, PORT, 60)
client.loop_start()

time.sleep(10)
client.loop_stop()
client.disconnect()
print("Done test.")
