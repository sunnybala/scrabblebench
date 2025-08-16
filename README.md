# ScrabbleBench

ScrabbleBench tests the ability of AI models to play scrabble against each other. Read more about this project [here](https://sunnybala.github.io/scrabblebench/)!

---

## 🚀 Getting Started

These instructions will get you a local copy of the project up and running for development or use.

### 1. Clone this Repository
```bash
git clone https://github.com/sunnybala/scrabblebench.git
```

### 2. Clone the Scrabble Solver Repository
```bash
git clone https://github.com/kamilmielnik/scrabble-solver.git
```

Follow the instructions at [the repo](https://github.com/kamilmielnik) to kick off the solver server. I ran it at port 3000 -- change app.py if your solver is hosted on a different port like 3333.

```python
# modify app.py
response = requests.post('http://localhost:3000/api/solve', headers=headers, json=json_data)
```

### 3. Install Python Dependencies in This Repo. I used python 3.9.4 for reference.
```bash
pip install -r requirements.txt
```

### 4. Input Keys / Params
In .env, enter in your OpenRouter key and your xAI key.
```python
XAI_API_KEY = 'blah'
OPENROUTER_API_KEY = 'blah'
```
Additionally, pick a seed in script.py so that games are consistent.
```
this.rng = new SeededRandom(42); 
```
### 5. Kick off this App
```
python app.py
```

### 4. Run a Game
The models are set via url params using the openrouter names. Here's some examples! Some models on OpenRouter require bringing your own keys.
```
http://localhost:5001/?model1=google/gemini-2.0-flash-lite-001&model2=google/gemini-2.0-flash-lite-001&model3=google/gemini-2.0-flash-lite-001&model4=google/gemini-2.0-flash-lite-001

http://localhost:5001/?model1=moonshotai/kimi-k2&model2=moonshotai/kimi-k2&model3=moonshotai/kimi-k2&model4=moonshotai/kimi-k2
```

When the game is done, the turn actions and final board will be downloaded automatically. 

### 4. URL params
There's a few extra URL params you can use to get different behavior.
If you set tournament=True in the url params, images of all boards will be saved down in a json of base64 encoded images. This is for making videos.
If you set dataset=True in the url params, the board, rack and possible words will be saved down each round. This is for making the 5K dataset dataset.json that 
I've also [hosted on huggingface](https://huggingface.co/datasets/sunnymbala/scrabble-rounds-5k).