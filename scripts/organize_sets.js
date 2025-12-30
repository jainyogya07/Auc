import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.join(__dirname, '../server/mockData.js');

// Known Lists for Role Correction
const KNOWN_WICKET_KEEPERS = [
    "MS Dhoni", "Rishabh Pant", "K L Rahul", "Sanju Samson", "Ishan Kishan",
    "Jos Buttler", "Quinton de Kock", "Nicholas Pooran", "Phil Salt", "Jitesh Sharma",
    "Dhruv Jurel", "Heinrich Klaasen", "Rahmanullah Gurbaz", "Anuj Rawat",
    "Dinesh Karthik", "K S Bharat", "Wriddhiman Saha", "Abishek Porel",
    "Tristan Stubbs", "Robin Minz", "Shai Hope", "Jonny Bairstow", "Josh Inglis"
];

const KNOWN_ALL_ROUNDERS = [
    "Hardik Pandya", "Ravindra Jadeja", "Axar Patel", "Marcus Stoinis",
    "Glenn Maxwell", "Cameron Green", "Mitchell Marsh", "Liam Livingstone",
    "Andre Russell", "Sunil Narine", "Moeen Ali", "Washington Sundar",
    "Krunal Pandya", "Nitish Kumar Reddy", "Shahbaz Ahmed", "Wanindu Hasaranga",
    "Marco Jansen", "Shivam Dube", "Rachin Ravindra", "Daryl Mitchell",
    "Azmatullah Omarzai", "Romario Shepherd", "Mohammad Nabi", "Shakib Al Hasan",
    "Shardul Thakur", "R Ashwin", "Ravichandran Ashwin", "Rahul Tewatia",
    "Venkatesh Iyer", "Deepak Hooda", "Riyan Parag", "Abhishek Sharma", // Often listed as AR
    "Will Jacks", "Sam Curran"
];

const KNOWN_BOWLERS = [
    "Jasprit Bumrah", "Mohammed Shami", "Mohammed Siraj", "Arshdeep Singh",
    "Trent Boult", "Mitchell Starc", "Pat Cummins", "Kagiso Rabada",
    "Kuldeep Yadav", "Yuzvendra Chahal", "Rashid Khan", "Ravi Bishnoi",
    "Varun Chakaravarthy", "T Natarajan", "Bhuvneshwar Kumar", "Deepak Chahar",
    "Harshal Patel", "Avesh Khan", "Khaleel Ahmed", "Mohit Sharma",
    "Sandeep Sharma", "Ishant Sharma", "Umesh Yadav", "Mayank Yadav",
    "Gerald Coetzee", "Kwena Maphaka", "Matheesha Pathirana", "Mustafizur Rahman",
    "Noor Ahmad", "Maheesh Theekshana", "Lockie Ferguson", "Spencer Johnson",
    "Alzarri Joseph", "Naveen-ul-Haq", "Fazalhaq Farooqi", "Josh Hazlewood",
    "Nathan Ellis", "Akash Deep", "Mukesh Kumar", "Prasidh Krishna",
    "Tushar Deshpande", "Simarjeet Singh", "Yash Dayal", "Vijaykumar Vyshak",
    "Rasikh Salam", "Vaibhav Arora", "Harshit Rana", "Mayank Markande",
    "Rahul Chahar", "Suyash Sharma", "Anrich Nortje", "Lungi Ngidi"
];

// Marquee Players List (Hardcoded for realism)
const MARQUEE_NAMES = [
    "Rishabh Pant", "Shreyas Iyer", "K L Rahul", "Arshdeep Singh",
    "Mitchell Starc", "Jos Buttler", "Sanju Samson", "David Miller",
    "Mohammed Shami", "Mohammed Siraj", "Kagiso Rabada", "Liam Livingstone",
    "Yashasvi Jaiswal", "Hardik Pandya", "Ravindra Jadeja", "Axar Patel",
    "Rashid Khan", "Trent Boult", "Bhuvneshwar Kumar", "Yuzvendra Chahal"
];

// Set Definitions
const SETS = {
    MARQUEE: 1,
    BATTERS_1: 2,
    BOWLERS_1: 3,
    ALLROUNDERS_1: 4,
    WK_1: 5,
    SPINNERS_1: 6,
    UNCAPPED_BATTERS: 7,
    UNCAPPED_BOWLERS: 8,
    UNCAPPED_ALLROUNDERS: 9,
    UNCAPPED_WK: 10,
    UNSOLD_LIST: 11
};

function organizePlayers() {
    try {
        let fileContent = fs.readFileSync(mockDataPath, 'utf8');

        // Robust start index finding
        const match = fileContent.match(/const INITIAL_PLAYERS\s*=\s*/);
        if (!match) throw new Error("Could not find 'const INITIAL_PLAYERS ='");

        const openBracketIndex = fileContent.indexOf('[', match.index + match[0].length);
        if (openBracketIndex === -1) throw new Error("Could not find opening bracket for INITIAL_PLAYERS");

        const startIndex = openBracketIndex;

        // Find the matching closing bracket
        let openBrackets = 0;
        let endIndex = -1;

        for (let i = startIndex; i < fileContent.length; i++) {
            if (fileContent[i] === '[') openBrackets++;
            if (fileContent[i] === ']') openBrackets--;

            if (openBrackets === 0) {
                endIndex = i + 1;
                break;
            }
        }

        if (endIndex === -1) throw new Error("Could not find matching closing bracket for players array");

        const playersJsonStr = fileContent.substring(startIndex, endIndex);

        // Evaluate the array string to a JS object
        let players;
        try {
            players = eval('(' + playersJsonStr + ')');
        } catch (e) {
            console.error("Failed to parse players array:", e);
            throw e;
        }

        // --- LOGIC START ---

        players = players.map(p => {
            // A. Correct Roles first
            if (KNOWN_WICKET_KEEPERS.includes(p.name)) p.role = 'Wicket Keeper';
            else if (KNOWN_ALL_ROUNDERS.includes(p.name)) p.role = 'All-Rounder';
            else if (KNOWN_BOWLERS.includes(p.name)) p.role = 'Bowler';
            // Else keep existing role (mostly Batsman)

            const isCapped = p.basePrice >= 0.5;

            // B. Assign Sets
            // 1. Marquee (Override everything)
            if (MARQUEE_NAMES.includes(p.name)) {
                p.set = SETS.MARQUEE;
                return p;
            }

            // 2. Capped Categories
            if (isCapped) {
                switch (p.role) {
                    case 'Batsman': p.set = SETS.BATTERS_1; break;
                    case 'Bowler': p.set = SETS.BOWLERS_1; break;
                    case 'All-Rounder': p.set = SETS.ALLROUNDERS_1; break;
                    case 'Wicket Keeper': p.set = SETS.WK_1; break;
                    default: p.set = SETS.BATTERS_1;
                }
            }
            // 3. Uncapped Categories
            else {
                switch (p.role) {
                    case 'Batsman': p.set = SETS.UNCAPPED_BATTERS; break;
                    case 'Bowler': p.set = SETS.UNCAPPED_BOWLERS; break;
                    case 'All-Rounder': p.set = SETS.UNCAPPED_ALLROUNDERS; break;
                    case 'Wicket Keeper': p.set = SETS.UNCAPPED_WK; break;
                    default: p.set = SETS.UNCAPPED_BATTERS;
                }
            }
            return p;
        });

        // Sort players by Set ID to make the auction flow logical
        players.sort((a, b) => a.set - b.set);

        // --- LOGIC END ---

        // Reconstruct the file content
        const newPlayersStr = JSON.stringify(players, null, 4);
        const newContent = fileContent.substring(0, startIndex) + newPlayersStr + fileContent.substring(endIndex);

        fs.writeFileSync(mockDataPath, newContent);
        console.log(`Successfully organized and corrected roles for ${players.length} players.`);

        // Log counts per set
        const counts = {};
        players.forEach(p => {
            counts[p.set] = (counts[p.set] || 0) + 1;
        });
        console.log('Set Counts:', counts);

    } catch (err) {
        console.error("Error organizing players:", err);
        process.exit(1);
    }
}

organizePlayers();
