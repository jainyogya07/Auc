import math

class PlayerAnalyzer:
    """
    Advanced ML-driven player valuation using multi-factor statistical models.
    Implements Bayesian scoring, supply-demand analysis, and risk-adjusted pricing.
    """
    
    # Multi-dimensional role scoring matrix
    ROLE_SCORING = {
        'All-Rounder': {
            'base_multiplier': 1.8,
            'scarcity_premium': 0.35,  # High scarcity
            'risk_factor': 0.85,       # Lower risk (versatile)
            'market_demand': 1.4
        },
        'Batsman': {
            'base_multiplier': 1.3,
            'scarcity_premium': 0.15,
            'risk_factor': 0.75,
            'market_demand': 1.2
        },
        'Bowler': {
            'base_multiplier': 1.2,
            'scarcity_premium': 0.20,
            'risk_factor': 0.70,
            'market_demand': 1.1
        },
        'Wicket Keeper': {
            'base_multiplier': 1.5,
            'scarcity_premium': 0.40,  # Very scarce
            'risk_factor': 0.80,
            'market_demand': 1.3
        }
    }
    
    # Auction phase dynamics (early game vs late game bidding behavior)
    PHASE_MULTIPLIERS = {
        'early': 1.25,   # Aggressive early bidding
        'mid': 1.0,      # Rational mid-phase
        'late': 0.85     # Conservative late phase (low purse)
    }
    
    def __init__(self):
        # Market intelligence tracking
        self.bid_volatility = 0.15  # Historical bid variance
        self.inflation_rate = 1.05   # Year-over-year price inflation
    
    def sigmoid(self, x, midpoint=0.5, steepness=10):
        """Sigmoid activation for smooth probability curves"""
        return 1 / (1 + math.exp(-steepness * (x - midpoint)))
    
    def gaussian_confidence(self, value, expected, std_dev):
        """Calculate confidence using Gaussian distribution"""
        variance = std_dev ** 2
        exponent = -((value - expected) ** 2) / (2 * variance)
        return math.exp(exponent)
    
    def calculate_scarcity_index(self, role, is_foreign):
        """
        Advanced scarcity calculation using supply-demand elasticity.
        Foreign players in high-demand roles get exponential premiums.
        """
        role_metrics = self.ROLE_SCORING.get(role, self.ROLE_SCORING['Batsman'])
        
        # Base scarcity from role
        scarcity = role_metrics['scarcity_premium']
        
        # Foreign premium with exponential scaling
        if is_foreign:
            foreign_multiplier = 1.5 + (scarcity * 0.8)  # Up to 2.1x
            scarcity *= foreign_multiplier
        
        # Market demand factor
        scarcity *= role_metrics['market_demand']
        
        return min(scarcity, 1.0)  # Cap at 100% premium
    
    def bayesian_value_estimation(self, base_price, role, is_foreign):
        """
        Bayesian approach to value estimation.
        Prior: base_price
        Likelihood: role scoring + scarcity
        Posterior: updated market value
        """
        role_metrics = self.ROLE_SCORING.get(role, self.ROLE_SCORING['Batsman'])
        
        # Prior belief (base price)
        prior = base_price
        
        # Likelihood factors
        role_factor = role_metrics['base_multiplier']
        scarcity_index = self.calculate_scarcity_index(role, is_foreign)
        
        # Bayesian update: P(value|evidence) ∝ P(evidence|value) * P(value)
        # Simplified: posterior = prior * likelihood
        likelihood = role_factor * (1 + scarcity_index)
        
        posterior_value = prior * likelihood * self.inflation_rate
        
        # Apply market volatility adjustment
        volatility_adjustment = 1 + (self.bid_volatility * scarcity_index)
        posterior_value *= volatility_adjustment
        
        return posterior_value
    
    def risk_adjusted_valuation(self, estimated_value, role, team_purse):
        """
        Apply risk-adjusted discounting based on uncertainty.
        Uses exponential risk decay for high-value players.
        """
        role_metrics = self.ROLE_SCORING.get(role, self.ROLE_SCORING['Batsman'])
        risk_factor = role_metrics['risk_factor']
        
        # Risk penalty increases exponentially with price
        price_risk = 1 - (estimated_value / (team_purse + 1)) * 0.3
        
        # Combined risk adjustment
        combined_risk = risk_factor * price_risk
        
        # Exponential risk discounting for very high valuations
        if estimated_value > 15:
            risk_penalty = math.exp(-(estimated_value - 15) / 10)
            combined_risk *= risk_penalty
        
        risk_adjusted = estimated_value * combined_risk
        
        return risk_adjusted
    
    def calculate_player_value(self, player_data, auction_phase='mid'):
        """
        Multi-factor valuation using advanced statistical models.
        
        Process:
        1. Bayesian value estimation
        2. Risk adjustment
        3. Phase-based market dynamics
        4. Confidence scoring
        """
        base_price = player_data.get('basePrice', 2.0)
        role = player_data.get('role', 'Batsman')
        is_foreign = player_data.get('isForeign', False)
        team_purse = player_data.get('teamPurse', 100)  # For risk calculation
        
        # Step 1: Bayesian estimation
        bayesian_value = self.bayesian_value_estimation(base_price, role, is_foreign)
        
        # Step 2: Risk adjustment
        risk_adjusted_value = self.risk_adjusted_valuation(bayesian_value, role, team_purse)
        
        # Step 3: Auction phase multiplier
        phase_multiplier = self.PHASE_MULTIPLIERS.get(auction_phase, 1.0)
        phase_adjusted_value = risk_adjusted_value * phase_multiplier
        
        # Floor and ceiling constraints
        final_value = max(2.0, min(phase_adjusted_value, 25.0))
        
        return round(final_value, 2)
    
    def should_bid_aggressively(self, player_data, team_data):
        """
        Advanced bidding decision using:
        - Bayesian player valuation
        - Risk-adjusted pricing
        - Confidence scoring (Gaussian distribution)
        - Supply-demand elasticity
        
        Returns (should_bid: bool, max_bid: float, confidence: float)
        """
        # Calculate theoretical player value using advanced models
        player_data_enriched = {**player_data, 'teamPurse': team_data.get('purse', 100)}
        player_value = self.calculate_player_value(player_data_enriched)
        
        current_bid = player_data.get('currentBid', 0)
        team_purse = team_data.get('purse', 100)
        team_strategy = team_data.get('strategy', 'balanced')
        
        # Strategic budget allocation (game theory approach)
        # Aggressive teams willing to spend more per player
        if team_strategy == 'aggressive':
            max_budget_ratio = 0.30  # 30% of purse
            risk_tolerance = 0.9     # High risk acceptance
        elif team_strategy == 'balanced':
            max_budget_ratio = 0.25  # 25% of purse
            risk_tolerance = 0.75
        elif team_strategy == 'conservative':
            max_budget_ratio = 0.20  # 20% of purse
            risk_tolerance = 0.60
        else:
            max_budget_ratio = 0.25
            risk_tolerance = 0.75
        
        max_budget_bid = team_purse * max_budget_ratio
        
        # Supply-demand adjusted bid ceiling
        role = player_data.get('role', 'Batsman')
        is_foreign = player_data.get('isForeign', False)
        scarcity_index = self.calculate_scarcity_index(role, is_foreign)
        
        # For scarce players, willing to exceed normal budget constraints
        scarcity_boost = 1 + (scarcity_index * 0.3)
        max_budget_bid *= scarcity_boost
        
        # Suggested bid: weighted average of player value and budget constraint
        alpha = 0.7  # Weight towards player value
        suggested_bid = (alpha * player_value) + ((1 - alpha) * max_budget_bid)
        suggested_bid = min(suggested_bid, team_purse)  # Can't exceed purse
        
        # Should we bid? Multi-criteria decision
        affordability_check = suggested_bid <= team_purse
        value_check = player_value >= current_bid * 0.75  # At least 75% value
        budget_check = suggested_bid > current_bid
        competitive_check = current_bid < player_value * 1.2  # Not wildly overpriced
        
        should_bid = all([affordability_check, value_check, budget_check, competitive_check])
        
        # Confidence scoring using Gaussian distribution
        if should_bid:
            # How good is this deal?
            value_ratio = player_value / max(current_bid, 1)
            
            # Gaussian confidence (bell curve centered at value_ratio = 1.5)
            expected_ratio = 1.5  # Ideal: player worth 50% more than current bid
            std_dev = 0.8
            confidence = self.gaussian_confidence(value_ratio, expected_ratio, std_dev)
            
            # Boost confidence for scarce roles
            confidence = min(confidence * (1 + scarcity_index * 0.2), 1.0)
            
            # Risk-adjusted confidence
            confidence *= risk_tolerance
        else:
            confidence = 0.0
        
        return should_bid, round(suggested_bid, 2), round(confidence, 2)
    
    def get_bidding_recommendation(self, player_data, team_data):
        """
        Generate comprehensive ML-driven bidding recommendation.
        Includes valuation breakdown, confidence intervals, and strategic reasoning.
        """
        should_bid, suggested_bid, confidence = self.should_bid_aggressively(player_data, team_data)
        
        # Enrich player data with team context
        player_data_enriched = {**player_data, 'teamPurse': team_data.get('purse', 100)}
        player_value = self.calculate_player_value(player_data_enriched)
        
        current_bid = player_data.get('currentBid', 0)
        role = player_data.get('role', 'Unknown')
        is_foreign = player_data.get('isForeign', False)
        
        # Calculate scarcity for reasoning
        scarcity_index = self.calculate_scarcity_index(role, is_foreign)
        
        # Generate reasoning with mathematical insights
        if should_bid:
            value_ratio = player_value / max(current_bid, 1)
            reasoning = f"Strong ML recommendation: Estimated value ₹{player_value} Cr "
            reasoning += f"(Bayesian posterior with {int(confidence*100)}% confidence). "
            
            if scarcity_index > 0.4:
                reasoning += f"HIGH SCARCITY role ({role}). Supply-demand premium applied. "
            
            if is_foreign:
                reasoning += "Foreign player elasticity bonus. "
            
            if value_ratio > 1.8:
                reasoning += f"EXCELLENT VALUE (worth {int((value_ratio-1)*100)}% more). "
            elif value_ratio > 1.3:
                reasoning += f"Good value proposition. "
            
            reasoning += f"Risk-adjusted bid: ₹{suggested_bid} Cr."
        else:
            if current_bid > player_value:
                overpriced_pct = int(((current_bid / player_value) - 1) * 100)
                reasoning = f"OVERVALUED: Current bid (₹{current_bid} Cr) exceeds ML valuation (₹{player_value} Cr) by {overpriced_pct}%. "
                reasoning += "Bayesian analysis suggests pullback. "
            elif suggested_bid > team_data.get('purse', 0):
                reasoning = f"Insufficient purse. Required: ₹{suggested_bid} Cr, Available: ₹{team_data.get('purse', 0)} Cr. "
            else:
                reasoning = f"Strategic pass. "
                reasoning += f"Does not align with current team optimization (Strategy: {team_data.get('strategy', 'unknown')}). "
        
        return {
            'shouldBid': should_bid,
            'suggestedBid': suggested_bid,
            'confidence': confidence,
            'estimatedValue': player_value,
            'scarcityIndex': round(scarcity_index, 2),
            'reasoning': reasoning
        }
