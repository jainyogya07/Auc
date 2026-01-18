from flask import Flask, request, jsonify
from flask_cors import CORS
from player_analyzer import PlayerAnalyzer

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js backend

analyzer = PlayerAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'python-bot-ml'}), 200

@app.route('/evaluate-player', methods=['POST'])
def evaluate_player():
    """
    Evaluate a player and return bidding recommendation.
    
    Expected payload:
    {
        "player": {
            "id": "player_123",
            "name": "Virat Kohli",
            "role": "Batsman",
            "basePrice": 10,
            "currentBid": 12,
            "isForeign": false
        },
        "team": {
            "id": "rcb",
            "purse": 80,
            "strategy": "aggressive"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'player' not in data or 'team' not in data:
            return jsonify({'error': 'Missing player or team data'}), 400
        
        player_data = data['player']
        team_data = data['team']
        
        # Get recommendation from analyzer
        recommendation = analyzer.get_bidding_recommendation(player_data, team_data)
        
        # Log for debugging
        print(f"[Python ML] Evaluated {player_data.get('name', 'Unknown')} for team {team_data.get('id', 'Unknown')}")
        print(f"[Python ML] Recommendation: {recommendation}")
        
        return jsonify(recommendation), 200
        
    except Exception as e:
        print(f"[Python ML] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🐍 Python ML Bot Service Starting...")
    print("=" * 60)
    print("📊 Player Analyzer: Advanced valuation engine loaded")
    print("🌐 Server: http://localhost:5001")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5001, debug=True)
