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
```
# modify app.py
response = requests.post('http://localhost:3000/api/solve', headers=headers, json=json_data)
``

### 3. Install Python Dependencies in This Repo
```
pip install -r requirements.txt
```

### 4. Input Keys / Params
In static/script.js, enter in your OpenRouter key.
```
// insecure for public deployment! use this to run locally.
const OPENROUTER_KEY = ''
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

When the game is done, the turn actions and final board will be downloaded automatically. If you set tournament=True in the url params, images of all boards will be saved down 
in a json of base64 encoded images.