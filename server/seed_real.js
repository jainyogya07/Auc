const fs = require('fs');
const path = require('path');

const REAL_PLAYERS = [
    // SET 1: M1 (Marquee 1)
    { name: "Jos Buttler", role: "Wicket Keeper", country: "England", basePrice: 2.0, set: 1 },
    { name: "Shreyas Iyer", role: "Batsman", country: "India", basePrice: 2.0, set: 1 },
    { name: "Rishabh Pant", role: "Wicket Keeper", country: "India", basePrice: 2.0, set: 1 },
    { name: "Kagiso Rabada", role: "Bowler", country: "South Africa", basePrice: 2.0, set: 1 },
    { name: "Arshdeep Singh", role: "Bowler", country: "India", basePrice: 2.0, set: 1 },
    { name: "Mitchell Starc", role: "Bowler", country: "Australia", basePrice: 2.0, set: 1 },

    // SET 2: M2 (Marquee 2)
    { name: "Yuzvendra Chahal", role: "Bowler", country: "India", basePrice: 2.0, set: 2 },
    { name: "Liam Livingstone", role: "All-Rounder", country: "England", basePrice: 2.0, set: 2 },
    { name: "David Miller", role: "Batsman", country: "South Africa", basePrice: 1.5, set: 2 },
    { name: "KL Rahul", role: "Wicket Keeper", country: "India", basePrice: 2.0, set: 2 },
    { name: "Mohammad Shami", role: "Bowler", country: "India", basePrice: 2.0, set: 2 },
    { name: "Mohammad Siraj", role: "Bowler", country: "India", basePrice: 2.0, set: 2 },

    // SET 3: BA1 (Batters 1)
    { name: "Harry Brook", role: "Batsman", country: "England", basePrice: 2.0, set: 3 },
    { name: "Devon Conway", role: "Batsman", country: "New Zealand", basePrice: 2.0, set: 3 },
    { name: "Jake Fraser-McGurk", role: "Batsman", country: "Australia", basePrice: 2.0, set: 3 },
    { name: "Aiden Markram", role: "Batsman", country: "South Africa", basePrice: 2.0, set: 3 },
    { name: "Devdutt Padikkal", role: "Batsman", country: "India", basePrice: 2.0, set: 3 },
    { name: "Rahul Tripathi", role: "Batsman", country: "India", basePrice: 0.75, set: 3 },
    { name: "David Warner", role: "Batsman", country: "Australia", basePrice: 2.0, set: 3 },

    // SET 4: AL1 (All Rounders 1)
    { name: "Ravichandran Ashwin", role: "All-Rounder", country: "India", basePrice: 2.0, set: 4 },
    { name: "Venkatesh Iyer", role: "All-Rounder", country: "India", basePrice: 2.0, set: 4 },
    { name: "Mitchell Marsh", role: "All-Rounder", country: "Australia", basePrice: 2.0, set: 4 },
    { name: "Glenn Maxwell", role: "All-Rounder", country: "Australia", basePrice: 2.0, set: 4 },
    { name: "Harshal Patel", role: "All-Rounder", country: "India", basePrice: 2.0, set: 4 },
    { name: "Rachin Ravindra", role: "All-Rounder", country: "New Zealand", basePrice: 1.5, set: 4 },
    { name: "Marcus Stoinis", role: "All-Rounder", country: "Australia", basePrice: 2.0, set: 4 },

    // SET 5: WK1 (Wicket Keepers 1)
    { name: "Jonny Bairstow", role: "Wicket Keeper", country: "England", basePrice: 2.0, set: 5 },
    { name: "Quinton De Kock", role: "Wicket Keeper", country: "South Africa", basePrice: 2.0, set: 5 },
    { name: "Rahmanullah Gurbaz", role: "Wicket Keeper", country: "Afghanistan", basePrice: 2.0, set: 5 },
    { name: "Ishan Kishan", role: "Wicket Keeper", country: "India", basePrice: 2.0, set: 5 },
    { name: "Phil Salt", role: "Wicket Keeper", country: "England", basePrice: 2.0, set: 5 },
    { name: "Jitesh Sharma", role: "Wicket Keeper", country: "India", basePrice: 1.0, set: 5 },

    // SET 6: FA1 (Fast Bowlers 1)
    { name: "Syed Khaleel Ahmed", role: "Bowler", country: "India", basePrice: 2.0, set: 6 },
    { name: "Trent Boult", role: "Bowler", country: "New Zealand", basePrice: 2.0, set: 6 },
    { name: "Josh Hazlewood", role: "Bowler", country: "Australia", basePrice: 2.0, set: 6 },
    { name: "Avesh Khan", role: "Bowler", country: "India", basePrice: 2.0, set: 6 },
    { name: "Prasidh Krishna", role: "Bowler", country: "India", basePrice: 2.0, set: 6 },
    { name: "T. Natarajan", role: "Bowler", country: "India", basePrice: 2.0, set: 6 },
    { name: "Anrich Nortje", role: "Bowler", country: "South Africa", basePrice: 2.0, set: 6 },

    // SET 7: SP1 (Spinners 1)
    { name: "Noor Ahmad", role: "Bowler", country: "Afghanistan", basePrice: 2.0, set: 7 },
    { name: "Rahul Chahar", role: "Bowler", country: "India", basePrice: 1.0, set: 7 },
    { name: "Wanindu Hasaranga", role: "Bowler", country: "Sri Lanka", basePrice: 2.0, set: 7 },
    { name: "Waqar Salamkheil", role: "Bowler", country: "Afghanistan", basePrice: 0.75, set: 7 },
    { name: "Maheesh Theekshana", role: "Bowler", country: "Sri Lanka", basePrice: 2.0, set: 7 },
    { name: "Adam Zampa", role: "Bowler", country: "Australia", basePrice: 2.0, set: 7 },

    // SET 8: UBA1 (Uncapped Batters)
    { name: "Yash Dhull", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },
    { name: "Abhinav Manohar", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },
    { name: "Karun Nair", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },
    { name: "Angkrish Raghuvanshi", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },
    { name: "Anmolpreet Singh", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },
    { name: "Atharva Taide", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },
    { name: "Nehal Wadhera", role: "Batsman", country: "India", basePrice: 0.30, set: 8 },

    // SET 9: UAL1 (Uncapped All Rounders)
    { name: "Harpreet Brar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Naman Dhir", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Mahipal Lomror", role: "All-Rounder", country: "India", basePrice: 0.50, set: 9 },
    { name: "Sameer Rizvi", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Abdul Samad", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Vijay Shankar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Ashutosh Sharma", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Nishant Sindhu", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },
    { name: "Utkarsh Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 9 },

    // SET 10: UWK1 (Uncapped Wicket Keepers)
    { name: "Aryan Juyal", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },
    { name: "Kumar Kushagra", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },
    { name: "Robin Minz", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },
    { name: "Anuj Rawat", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },
    { name: "Luvnith Sisodia", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },
    { name: "Vishnu Vinod", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },
    { name: "Upendra Singh Yadav", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 10 },

    // SET 11: UFA1 (Uncapped Fast Bowlers 1)
    { name: "Vaibhav Arora", role: "Bowler", country: "India", basePrice: 0.30, set: 11 },
    { name: "Rasikh Dar", role: "Bowler", country: "India", basePrice: 0.30, set: 11 },
    { name: "Akash Madhwal", role: "Bowler", country: "India", basePrice: 0.30, set: 11 },
    { name: "Mohit Sharma", role: "Bowler", country: "India", basePrice: 0.50, set: 11 },
    { name: "Simarjeet Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 11 },
    { name: "Yash Thakur", role: "Bowler", country: "India", basePrice: 0.30, set: 11 },
    { name: "Kartik Tyagi", role: "Bowler", country: "India", basePrice: 0.40, set: 11 },
    { name: "Vyshak Vijaykumar", role: "Bowler", country: "India", basePrice: 0.30, set: 11 },

    // SET 12: USP1 (Uncapped Spinners 1)
    { name: "Piyush Chawla", role: "Bowler", country: "India", basePrice: 0.50, set: 12 },
    { name: "Shreyas Gopal", role: "Bowler", country: "India", basePrice: 0.30, set: 12 },
    { name: "Mayank Markande", role: "Bowler", country: "India", basePrice: 0.30, set: 12 },
    { name: "Suyash Sharma", role: "Bowler", country: "India", basePrice: 0.30, set: 12 },
    { name: "Karn Sharma", role: "Bowler", country: "India", basePrice: 0.50, set: 12 },
    { name: "Kumar Kartikeya Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 12 },
    { name: "Manav Suthar", role: "Bowler", country: "India", basePrice: 0.30, set: 12 },

    // SET 13: BA2 (Batters 2)
    { name: "Mayank Agarwal", role: "Batsman", country: "India", basePrice: 1.0, set: 13 },
    { name: "Faf Du Plessis", role: "Batsman", country: "South Africa", basePrice: 2.0, set: 13 },
    { name: "Glenn Phillips", role: "Batsman", country: "New Zealand", basePrice: 2.0, set: 13 },
    { name: "Rovman Powell", role: "Batsman", country: "West Indies", basePrice: 1.5, set: 13 },
    { name: "Ajinkya Rahane", role: "Batsman", country: "India", basePrice: 1.5, set: 13 },
    { name: "Prithvi Shaw", role: "Batsman", country: "India", basePrice: 0.75, set: 13 },
    { name: "Kane Williamson", role: "Batsman", country: "New Zealand", basePrice: 2.0, set: 13 },

    // SET 14: AL2 (All Rounders 2)
    { name: "Sam Curran", role: "All-Rounder", country: "England", basePrice: 2.0, set: 14 },
    { name: "Marco Jansen", role: "All-Rounder", country: "South Africa", basePrice: 1.25, set: 14 },
    { name: "Daryl Mitchell", role: "All-Rounder", country: "New Zealand", basePrice: 2.0, set: 14 },
    { name: "Krunal Pandya", role: "All-Rounder", country: "India", basePrice: 2.0, set: 14 },
    { name: "Nitish Rana", role: "All-Rounder", country: "India", basePrice: 1.5, set: 14 },
    { name: "Washington Sundar", role: "All-Rounder", country: "India", basePrice: 2.0, set: 14 },
    { name: "Shardul Thakur", role: "All-Rounder", country: "India", basePrice: 2.0, set: 14 },

    // SET 15: WK2 (Wicket Keepers 2)
    { name: "K.S Bharat", role: "Wicket Keeper", country: "India", basePrice: 0.75, set: 15 },
    { name: "Alex Carey", role: "Wicket Keeper", country: "Australia", basePrice: 1.0, set: 15 },
    { name: "Donovan Ferreira", role: "Wicket Keeper", country: "South Africa", basePrice: 0.75, set: 15 },
    { name: "Shai Hope", role: "Wicket Keeper", country: "West Indies", basePrice: 1.25, set: 15 },
    { name: "Josh Inglis", role: "Wicket Keeper", country: "Australia", basePrice: 2.0, set: 15 },
    { name: "Ryan Rickelton", role: "Wicket Keeper", country: "South Africa", basePrice: 1.0, set: 15 },

    // SET 16: FA2 (Fast Bowlers 2)
    { name: "Deepak Chahar", role: "Bowler", country: "India", basePrice: 2.0, set: 16 },
    { name: "Gerald Coetzee", role: "Bowler", country: "South Africa", basePrice: 1.25, set: 16 },
    { name: "Akash Deep", role: "Bowler", country: "India", basePrice: 1.0, set: 16 },
    { name: "Tushar Deshpande", role: "Bowler", country: "India", basePrice: 1.0, set: 16 },
    { name: "Lockie Ferguson", role: "Bowler", country: "New Zealand", basePrice: 2.0, set: 16 },
    { name: "Bhuvneshwar Kumar", role: "Bowler", country: "India", basePrice: 2.0, set: 16 },
    { name: "Mukesh Kumar", role: "Bowler", country: "India", basePrice: 2.0, set: 16 },

    // SET 17: SP2 (Spinners 2)
    { name: "Allah Ghazanfar", role: "Bowler", country: "Afghanistan", basePrice: 0.75, set: 17 },
    { name: "Akeal Hosein", role: "Bowler", country: "West Indies", basePrice: 1.5, set: 17 },
    { name: "Keshav Maharaj", role: "Bowler", country: "South Africa", basePrice: 0.75, set: 17 },
    { name: "Mujeeb Ur Rahman", role: "Bowler", country: "Afghanistan", basePrice: 2.0, set: 17 },
    { name: "Adil Rashid", role: "Bowler", country: "England", basePrice: 2.0, set: 17 },
    { name: "Vijayakanth Viyaskanth", role: "Bowler", country: "Sri Lanka", basePrice: 0.75, set: 17 },

    // SET 18: UBA2 (Uncapped Batters 2)
    { name: "Ricky Bhui", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Swastik Chhikara", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Aarya Desai", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Shubham Dubey", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Madhav Kaushik", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Pukhraj Mann", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Shaik Rasheed", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },
    { name: "Himmat Singh", role: "Batsman", country: "India", basePrice: 0.30, set: 18 },

    // SET 19: UAL2 (Uncapped All Rounders 2)
    { name: "Mayank Dagar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Anshul Kamboj", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Mohd. Arshad Khan", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Darshan Nalkande", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Suyash Prabhudessai", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Anukul Roy", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Swapnil Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },
    { name: "Sanvir Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 19 },

    // SET 20: UWK2 (Uncapped Wicket Keepers 2)
    { name: "Avanish Aravelly", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 20 },
    { name: "Vansh Bedi", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 20 },
    { name: "Saurav Chauhan", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 20 },
    { name: "Harvik Desai", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 20 },
    { name: "Tom Kohler-Cadmore", role: "Wicket Keeper", country: "England", basePrice: 0.50, set: 20 },
    { name: "Kunal Rathore", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 20 },
    { name: "B.R Sharath", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 20 },

    // SET 21: UFA2 (Uncapped Fast Bowlers 2)
    { name: "Gurnoor Singh Brar", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },
    { name: "Mukesh Choudhary", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },
    { name: "Sakib Hussain", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },
    { name: "Vidwath Kaverappa", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },
    { name: "Rajan Kumar", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },
    { name: "Sushant Mishra", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },
    { name: "Arjun Tendulkar", role: "Bowler", country: "India", basePrice: 0.30, set: 21 },

    // SET 22: USP2 (Uncapped Spinners 2)
    { name: "Zeeshan Ansari", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },
    { name: "Prince Choudhary", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },
    { name: "Himanshu Sharma", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },
    { name: "M. Siddharth", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },
    { name: "Digvesh Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },
    { name: "Prashant Solanki", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },
    { name: "Jhathavedh Subramabryan", role: "Bowler", country: "India", basePrice: 0.30, set: 22 },

    // SET 23: BA3 (Batters 3)
    { name: "Finn Allen", role: "Batsman", country: "New Zealand", basePrice: 2.0, set: 23 },
    { name: "Dewald Brevis", role: "Batsman", country: "South Africa", basePrice: 0.75, set: 23 },
    { name: "Ben Duckett", role: "Batsman", country: "England", basePrice: 2.0, set: 23 },
    { name: "Manish Pandey", role: "Batsman", country: "India", basePrice: 0.75, set: 23 },
    { name: "Rilee Rossouw", role: "Batsman", country: "South Africa", basePrice: 2.0, set: 23 },
    { name: "Sherfane Rutherford", role: "Batsman", country: "West Indies", basePrice: 1.5, set: 23 },
    { name: "Ashton Turner", role: "Batsman", country: "Australia", basePrice: 1.0, set: 23 },
    { name: "James Vince", role: "Batsman", country: "England", basePrice: 2.0, set: 23 },

    // SET 24: AL3 (All Rounders 3)
    { name: "Shahbaz Ahamad", role: "All-Rounder", country: "India", basePrice: 1.0, set: 24 },
    { name: "Moeen Ali", role: "All-Rounder", country: "England", basePrice: 2.0, set: 24 },
    { name: "Tim David", role: "All-Rounder", country: "Australia", basePrice: 2.0, set: 24 },
    { name: "Deepak Hooda", role: "All-Rounder", country: "India", basePrice: 0.75, set: 24 },
    { name: "Will Jacks", role: "All-Rounder", country: "England", basePrice: 2.0, set: 24 },
    { name: "Azmatullah Omarzai", role: "All-Rounder", country: "Afghanistan", basePrice: 1.5, set: 24 },
    { name: "R. Sai Kishore", role: "All-Rounder", country: "India", basePrice: 0.75, set: 24 },
    { name: "Romario Shepherd", role: "All-Rounder", country: "West Indies", basePrice: 1.5, set: 24 },

    // SET 25: WK3 (Wicket Keepers 3)
    { name: "Tom Banton", role: "Wicket Keeper", country: "England", basePrice: 2.0, set: 25 },
    { name: "Sam Billings", role: "Wicket Keeper", country: "England", basePrice: 1.5, set: 25 },
    { name: "Jordan Cox", role: "Wicket Keeper", country: "England", basePrice: 1.25, set: 25 },
    { name: "Ben McDermott", role: "Wicket Keeper", country: "Australia", basePrice: 0.75, set: 25 },
    { name: "Kusal Mendis", role: "Wicket Keeper", country: "Sri Lanka", basePrice: 0.75, set: 25 },
    { name: "Kusal Perera", role: "Wicket Keeper", country: "Sri Lanka", basePrice: 0.75, set: 25 },
    { name: "Josh Philippe", role: "Wicket Keeper", country: "Australia", basePrice: 0.75, set: 25 },
    { name: "Tim Seifert", role: "Wicket Keeper", country: "New Zealand", basePrice: 1.25, set: 25 },

    // SET 26: FA3 (Fast Bowlers 3)
    { name: "Nandre Burger", role: "Bowler", country: "South Africa", basePrice: 1.25, set: 26 },
    { name: "Spencer Johnson", role: "Bowler", country: "Australia", basePrice: 2.0, set: 26 },
    { name: "Umran Malik", role: "Bowler", country: "India", basePrice: 0.75, set: 26 },
    { name: "Mustafizur Rahman", role: "Bowler", country: "Bangladesh", basePrice: 2.0, set: 26 },
    { name: "Ishant Sharma", role: "Bowler", country: "India", basePrice: 0.75, set: 26 },
    { name: "Nuwan Thushara", role: "Bowler", country: "Sri Lanka", basePrice: 0.75, set: 26 },
    { name: "Naveen Ul Haq", role: "Bowler", country: "Afghanistan", basePrice: 2.0, set: 26 },
    { name: "Jaydev Unadkat", role: "Bowler", country: "India", basePrice: 1.0, set: 26 },
    { name: "Umesh Yadav", role: "Bowler", country: "India", basePrice: 2.0, set: 26 },

    // SET 27: SP3 (Spinners 3)
    { name: "Rishad Hossain", role: "Bowler", country: "Bangladesh", basePrice: 0.75, set: 27 },
    { name: "Zahir Khan Pakteen", role: "Bowler", country: "Afghanistan", basePrice: 0.75, set: 27 },
    { name: "Nqabayomzi Peter", role: "Bowler", country: "South Africa", basePrice: 0.75, set: 27 },
    { name: "Tanveer Sangha", role: "Bowler", country: "Australia", basePrice: 0.75, set: 27 },
    { name: "Tabraiz Shamsi", role: "Bowler", country: "South Africa", basePrice: 2.0, set: 27 },
    { name: "Jeffery Vandersay", role: "Bowler", country: "Sri Lanka", basePrice: 0.75, set: 27 },

    // SET 28: UBA3 (Uncapped Batters 3)
    { name: "Sachin Baby", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Priyam Garg", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Harnoor Pannu", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Smaran Ravichandran", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Shashwat Rawat", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Andre Siddarth", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Avneesh Sudha", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },
    { name: "Apoorv Wankhade", role: "Batsman", country: "India", basePrice: 0.30, set: 28 },

    // SET 29: UAL3 (Uncapped All Rounders 3)
    { name: "Yudhvir Charak", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Rishi Dhawan", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Rajvardhan Hangargekar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Tanush Kotian", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Arshin Kulkarni", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Shams Mulani", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Shivam Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },
    { name: "Lalit Yadav", role: "All-Rounder", country: "India", basePrice: 0.30, set: 29 },

    // SET 30: UWK3 (Uncapped Wicket Keepers 3)
    { name: "Mohammed Azharuddeen", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },
    { name: "L.R Chethan", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },
    { name: "Aryaman Singh Dhaliwal", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },
    { name: "Urvil Patel", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },
    { name: "Sanskar Rawat", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },
    { name: "Bipin Saurabh", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },
    { name: "Tanay Thyagarajann", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 30 },

    // SET 31: UFA3 (Uncapped Fast Bowlers 3)
    { name: "Money Grewal", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },
    { name: "Ashwani Kumar", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },
    { name: "Ishan Porel", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },
    { name: "Abhilash Shetty", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },
    { name: "Akash Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },
    { name: "Gurjapneet Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },
    { name: "Basil Thampi", role: "Bowler", country: "India", basePrice: 0.30, set: 31 },

    // SET 32: USP3 (Uncapped Spinners 3)
    { name: "Murugan Ashwin", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },
    { name: "Shreyas Chavan", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },
    { name: "Chintal Gandhi", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },
    { name: "Raghav Goyal", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },
    { name: "Jagadeesha Suchith", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },
    { name: "Roshan Waghsare", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },
    { name: "Bailapudi Yeswanth", role: "Bowler", country: "India", basePrice: 0.30, set: 32 },

    // SET 33: BA4 (Batters 4)
    { name: "Sediqullah Atal", role: "Batsman", country: "Afghanistan", basePrice: 0.75, set: 33 },
    { name: "Matthew Breetzke", role: "Batsman", country: "South Africa", basePrice: 0.75, set: 33 },
    { name: "Mark Chapman", role: "Batsman", country: "New Zealand", basePrice: 1.5, set: 33 },
    { name: "Brandon King", role: "Batsman", country: "West Indies", basePrice: 0.75, set: 33 },
    { name: "Evin Lewis", role: "Batsman", country: "West Indies", basePrice: 2.0, set: 33 },
    { name: "Pathum Nissanka", role: "Batsman", country: "Sri Lanka", basePrice: 0.75, set: 33 },
    { name: "Bhanuka Rajapaksa", role: "Batsman", country: "Sri Lanka", basePrice: 0.75, set: 33 },
    { name: "Steve Smith", role: "Batsman", country: "Australia", basePrice: 2.0, set: 33 },

    // SET 34: AL4 (All Rounders 4)
    { name: "Gus Atkinson", role: "All-Rounder", country: "England", basePrice: 2.0, set: 34 },
    { name: "Tom Curran", role: "All-Rounder", country: "England", basePrice: 2.0, set: 34 },
    { name: "Krishnappa Gowtham", role: "All-Rounder", country: "India", basePrice: 1.0, set: 34 },
    { name: "Mohammad Nabi", role: "All-Rounder", country: "Afghanistan", basePrice: 1.5, set: 34 },
    { name: "Gulbadin Naib", role: "All-Rounder", country: "Afghanistan", basePrice: 1.0, set: 34 },
    { name: "Sikandar Raza", role: "All-Rounder", country: "Zimbabwe", basePrice: 1.25, set: 34 },
    { name: "Mitchell Santner", role: "All-Rounder", country: "New Zealand", basePrice: 2.0, set: 34 },
    { name: "Jayant Yadav", role: "All-Rounder", country: "India", basePrice: 0.75, set: 34 },

    // SET 35: WK4 (Wicket Keepers 4)
    { name: "Johnson Charles", role: "Wicket Keeper", country: "West Indies", basePrice: 0.75, set: 35 },
    { name: "Litton Das", role: "Wicket Keeper", country: "Bangladesh", basePrice: 0.75, set: 35 },
    { name: "Andre Fletcher", role: "Wicket Keeper", country: "West Indies", basePrice: 0.75, set: 35 },
    { name: "Tom Latham", role: "Wicket Keeper", country: "New Zealand", basePrice: 1.5, set: 35 },
    { name: "Ollie Pope", role: "Wicket Keeper", country: "England", basePrice: 0.75, set: 35 },
    { name: "Kyle Verreynne", role: "Wicket Keeper", country: "South Africa", basePrice: 0.75, set: 35 },

    // SET 36: FA4 (Fast Bowlers 4)
    { name: "Fazalhaq Farooqi", role: "Bowler", country: "Afghanistan", basePrice: 2.0, set: 36 },
    { name: "Richard Gleeson", role: "Bowler", country: "England", basePrice: 0.75, set: 36 },
    { name: "Matt Henry", role: "Bowler", country: "New Zealand", basePrice: 2.0, set: 36 },
    { name: "Alzarri Joseph", role: "Bowler", country: "West Indies", basePrice: 2.0, set: 36 },
    { name: "Kwena Maphaka", role: "Bowler", country: "South Africa", basePrice: 0.75, set: 36 },
    { name: "Kuldeep Sen", role: "Bowler", country: "India", basePrice: 0.75, set: 36 },
    { name: "Reece Topley", role: "Bowler", country: "England", basePrice: 0.75, set: 36 },
    { name: "Lizaad Williams", role: "Bowler", country: "South Africa", basePrice: 0.75, set: 36 },
    { name: "Luke Wood", role: "Bowler", country: "England", basePrice: 0.75, set: 36 },

    // SET 37: UBA4 (Uncapped Batters 4)
    { name: "Sachin Dhas", role: "Batsman", country: "India", basePrice: 0.30, set: 37 },
    { name: "Leus Du Plooy", role: "Batsman", country: "England", basePrice: 0.50, set: 37 },
    { name: "Ashwin Hebbar", role: "Batsman", country: "India", basePrice: 0.30, set: 37 },
    { name: "Rohan Kunnummal", role: "Batsman", country: "India", basePrice: 0.30, set: 37 },
    { name: "Ayush Pandey", role: "Batsman", country: "India", basePrice: 0.30, set: 37 },
    { name: "Akshat Raghuwanshi", role: "Batsman", country: "India", basePrice: 0.30, set: 37 },
    { name: "Shoun Roger", role: "Batsman", country: "India", basePrice: 0.40, set: 37 },
    { name: "Virat Singh", role: "Batsman", country: "India", basePrice: 0.30, set: 37 },

    // SET 38: UAL4 (Uncapped All Rounders 4)
    { name: "Priyansh Arya", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Manoj Bhandage", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Pravin Dubey", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Ajay Mandal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Prerak Mankad", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Vipraj Nigam", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Vicky Ostwal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },
    { name: "Shivalik Sharma", role: "All-Rounder", country: "India", basePrice: 0.30, set: 38 },

    // SET 39: UWK4 (Uncapped Wicket Keepers 4)
    { name: "Salil Arora", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 39 },
    { name: "Dinesh Bana", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 39 },
    { name: "Ajitesh Guruswamy", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 39 },
    { name: "Narayan Jagadeesan", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 39 },
    { name: "Shrijith Krishnan", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 39 },
    { name: "Michael Pepper", role: "Wicket Keeper", country: "England", basePrice: 0.50, set: 39 },
    { name: "Vishnu Solanki", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 39 },

    // SET 40: UFA4 (Uncapped Fast Bowlers 4)
    { name: "K.M Asif", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },
    { name: "Akhil Chaudhary", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },
    { name: "Himanshu Chauhan", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },
    { name: "Arpit Guleria", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },
    { name: "Nishanth Saranu", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },
    { name: "Kuldip Yadav", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },
    { name: "Prithviraj Yarra", role: "Bowler", country: "India", basePrice: 0.30, set: 40 },

    // SET 41: USP4 (Uncapped Spinners 4)
    { name: "Shubham Agrawal", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },
    { name: "Jass Inder Baidwan", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },
    { name: "Jasmer Dhankhar", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },
    { name: "Pulkit Narang", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },
    { name: "Saumy Pandey", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },
    { name: "Mohit Rathee", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },
    { name: "Himanshu Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 41 },

    // SET 42: BA5 (Batters 5) - Image says set 42 is BAS (Batters 5).
    { name: "Towhid Hridoy", role: "Batsman", country: "Bangladesh", basePrice: 0.75, set: 42 },
    { name: "Mikyle Louis", role: "Batsman", country: "West Indies", basePrice: 0.75, set: 42 },
    { name: "Harry Tector", role: "Batsman", country: "Ireland", basePrice: 0.75, set: 42 },
    { name: "Rassie Van Der Dussen", role: "Batsman", country: "South Africa", basePrice: 2.0, set: 42 },
    { name: "Will Young", role: "Batsman", country: "New Zealand", basePrice: 1.25, set: 42 },
    { name: "Najibullah Zadran", role: "Batsman", country: "Afghanistan", basePrice: 0.75, set: 42 },
    { name: "Ibrahim Zadran", role: "Batsman", country: "Afghanistan", basePrice: 0.75, set: 42 },

    // SET 43: AL5 (All Rounders 5)
    { name: "Sean Abbott", role: "All-Rounder", country: "Australia", basePrice: 2.0, set: 43 },
    { name: "Jacob Bethell", role: "All-Rounder", country: "England", basePrice: 1.25, set: 43 },
    { name: "Brydon Carse", role: "All-Rounder", country: "England", basePrice: 1.0, set: 43 },
    { name: "Aaron Hardie", role: "All-Rounder", country: "Australia", basePrice: 1.25, set: 43 },
    { name: "Sarfaraz Khan", role: "All-Rounder", country: "India", basePrice: 0.75, set: 43 },
    { name: "Kyle Mayers", role: "All-Rounder", country: "West Indies", basePrice: 1.5, set: 43 },
    { name: "Kamindu Mendis", role: "All-Rounder", country: "Sri Lanka", basePrice: 0.75, set: 43 },
    { name: "Matthew Short", role: "All-Rounder", country: "Australia", basePrice: 0.75, set: 43 },

    // SET 44: FA5 (Fast Bowlers 5)
    { name: "Jason Behrendorff", role: "Bowler", country: "Australia", basePrice: 1.5, set: 44 },
    { name: "Dushmantha Chameera", role: "Bowler", country: "Sri Lanka", basePrice: 0.75, set: 44 },
    { name: "Nathan Ellis", role: "Bowler", country: "Australia", basePrice: 1.25, set: 44 },
    { name: "Shamar Joseph", role: "Bowler", country: "West Indies", basePrice: 0.75, set: 44 },
    { name: "Josh Little", role: "Bowler", country: "Ireland", basePrice: 0.75, set: 44 },
    { name: "Shivam Mavi", role: "Bowler", country: "India", basePrice: 0.75, set: 44 },
    { name: "Jhye Richardson", role: "Bowler", country: "Australia", basePrice: 1.5, set: 44 },
    { name: "Navdeep Saini", role: "Bowler", country: "India", basePrice: 0.75, set: 44 },

    // SET 45: UBA5 (Uncapped Batters 5)
    { name: "Tanmay Agarwal", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Amandeep Khare", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Ayush Mhatre", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Salman Nizar", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Aniket Verma", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Sumeet Verma", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Manan Vohra", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },
    { name: "Samarth Vyas", role: "Batsman", country: "India", basePrice: 0.30, set: 45 },

    // SET 46: UAL5 (Uncapped All Rounders 5)
    { name: "Raj Angad Bawa", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Emanjot Chahal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Musheer Khan", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Manvanth Kumar L", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Mayank Rawat", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Suryansh Shedge", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Hritik Shokeen", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },
    { name: "Sonu Yadav", role: "All-Rounder", country: "India", basePrice: 0.30, set: 46 },

    // SET 47: UWK5 (Uncapped Wicket Keepers 5)
    { name: "S. Rithik Easwaran", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },
    { name: "Anmol Malhotra", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },
    { name: "Pradosh Paul", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },
    { name: "Karteek Sharma", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },
    { name: "Akash Singh", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },
    { name: "Tejasvi Singh", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },
    { name: "Siddharth Yadav", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 47 },

    // SET 48: UFA5 (Uncapped Fast Bowlers 5)
    { name: "Saurabh Dubey", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },
    { name: "Aaqib Khan", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },
    { name: "Kulwant Khejroliya", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },
    { name: "Ankit Singh Rajpoot", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },
    { name: "Divesh Sharma", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },
    { name: "Naman Tiwari", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },
    { name: "Prince Yadav", role: "Bowler", country: "India", basePrice: 0.30, set: 48 },

    // SET 49: USP5 (Uncapped Spinners 5)
    { name: "Kunal Singh Chibb", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },
    { name: "Yuvraj Chudasama", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },
    { name: "Deepak Devadiga", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },
    { name: "Ramesh Prasad", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },
    { name: "Shivam Shukla", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },
    { name: "Himanshu Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },
    { name: "Tejpreet Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 49 },

    // SET 50: AL6 (All Rounders 6)
    { name: "Qais Ahmad", role: "All-Rounder", country: "Afghanistan", basePrice: 0.75, set: 50 },
    { name: "Charith Asalanka", role: "All-Rounder", country: "Sri Lanka", basePrice: 0.75, set: 50 },
    { name: "Michael Bracewell", role: "All-Rounder", country: "New Zealand", basePrice: 1.5, set: 50 },
    { name: "Gudakesh Motie", role: "All-Rounder", country: "West Indies", basePrice: 0.75, set: 50 },
    { name: "Daniel Mousley", role: "All-Rounder", country: "England", basePrice: 0.75, set: 50 },
    { name: "Jamie Overton", role: "All-Rounder", country: "England", basePrice: 1.5, set: 50 },
    { name: "Dunith Wellalage", role: "All-Rounder", country: "Sri Lanka", basePrice: 0.75, set: 50 },

    // SET 51: FA6 (Fast Bowlers 6)
    { name: "Ottneil Baartman", role: "Bowler", country: "South Africa", basePrice: 0.75, set: 51 },
    { name: "Xavier Bartlett", role: "Bowler", country: "Australia", basePrice: 0.75, set: 51 },
    { name: "Dilshan Madushanka", role: "Bowler", country: "Sri Lanka", basePrice: 0.75, set: 51 },
    { name: "Adam Milne", role: "Bowler", country: "New Zealand", basePrice: 2.0, set: 51 },
    { name: "Lungi Ngidi", role: "Bowler", country: "South Africa", basePrice: 1.0, set: 51 },
    { name: "William O'Rourke", role: "Bowler", country: "New Zealand", basePrice: 1.5, set: 51 },
    { name: "Chetan Sakariya", role: "Bowler", country: "India", basePrice: 0.75, set: 51 },
    { name: "Sandeep Warrier", role: "Bowler", country: "India", basePrice: 0.75, set: 51 },

    // SET 52: UBA6 (Uncapped Batters 6)
    { name: "Musaif Ajaz", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },
    { name: "Agni Chopra", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },
    { name: "Abhimanyu Easwaran", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },
    { name: "Sudip Gharami", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },
    { name: "Shubham Khajuria", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },
    { name: "Akhil Rawat", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },
    { name: "Prateek Yadav", role: "Batsman", country: "India", basePrice: 0.30, set: 52 },

    // SET 53: UAL6 (Uncapped All Rounders 6)
    { name: "Abdul Bazith", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "K.C Cariappa", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "Yuvraj Chaudhary", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "Aman Khan", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "Sumit Kumar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "Kamlesh Nagarkoti", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "Hardik Raj", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },
    { name: "Harsh Tyagi", role: "All-Rounder", country: "India", basePrice: 0.30, set: 53 },

    // SET 54: UWK6 (Uncapped Wicket Keepers 6)
    { name: "M. Ajnas", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 54 },
    { name: "Unmukt Chand", role: "Wicket Keeper", country: "USA", basePrice: 0.30, set: 54 },
    { name: "Tejasvi Dahiya", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 54 },
    { name: "Sumit Ghadigaonkar", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 54 },
    { name: "Baba Indrajith", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 54 },
    { name: "Muhammed Khan", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 54 },
    { name: "Bhagmender Lather", role: "Wicket Keeper", country: "India", basePrice: 0.30, set: 54 },

    // SET 55: UFA6 (Uncapped Fast Bowlers 6)
    { name: "Baltej Dhanda", role: "Bowler", country: "India", basePrice: 0.30, set: 55 },
    { name: "Ali Khan", role: "Bowler", country: "USA", basePrice: 0.30, set: 55 },
    { name: "Ravi Kumar", role: "Bowler", country: "India", basePrice: 0.30, set: 55 },
    { name: "Vineet Panwar", role: "Bowler", country: "India", basePrice: 0.30, set: 55 },
    { name: "Vidyadhar Patil", role: "Bowler", country: "India", basePrice: 0.30, set: 55 },
    { name: "Aradhya Shukla", role: "Bowler", country: "India", basePrice: 0.30, set: 55 },
    { name: "Abhinandan Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 55 },

    // SET 56: AL7 (All Rounders 7)
    { name: "Cooper Connolly", role: "All-Rounder", country: "Australia", basePrice: 0.75, set: 56 },
    { name: "Dushan Hemantha", role: "All-Rounder", country: "Sri Lanka", basePrice: 0.75, set: 56 },
    { name: "Jason Holder", role: "All-Rounder", country: "West Indies", basePrice: 2.0, set: 56 },
    { name: "Karim Janat", role: "All-Rounder", country: "Afghanistan", basePrice: 0.75, set: 56 },
    { name: "Jimmy Neesham", role: "All-Rounder", country: "New Zealand", basePrice: 1.5, set: 56 },
    { name: "Daniel Sams", role: "All-Rounder", country: "Australia", basePrice: 1.5, set: 56 },
    { name: "William Sutherland", role: "All-Rounder", country: "Australia", basePrice: 0.75, set: 56 },

    // SET 57: FA7 (Fast Bowlers 7)
    { name: "Taskin Ahmed", role: "Bowler", country: "Bangladesh", basePrice: 1.0, set: 57 },
    { name: "Ben Dwarshuis", role: "Bowler", country: "Australia", basePrice: 0.75, set: 57 },
    { name: "Obed McCoy", role: "Bowler", country: "West Indies", basePrice: 1.25, set: 57 },
    { name: "Riley Meredith", role: "Bowler", country: "Australia", basePrice: 1.5, set: 57 },
    { name: "Lance Morris", role: "Bowler", country: "Australia", basePrice: 1.25, set: 57 },
    { name: "Olly Stone", role: "Bowler", country: "England", basePrice: 0.75, set: 57 },
    { name: "Daniel Worrall", role: "Bowler", country: "England", basePrice: 1.5, set: 57 },

    // SET 58: UBA7 (Uncapped Batters 7)
    { name: "Pyla Avinash", role: "Batsman", country: "India", basePrice: 0.30, set: 58 },
    { name: "Kiran Chormale", role: "Batsman", country: "India", basePrice: 0.30, set: 58 },
    { name: "Ashish Dahariya", role: "Batsman", country: "India", basePrice: 0.30, set: 58 },
    { name: "Tushar Raheja", role: "Batsman", country: "India", basePrice: 0.30, set: 58 },
    { name: "Sarthak Ranjan", role: "Batsman", country: "India", basePrice: 0.30, set: 58 },
    { name: "Abhijeet Tomar", role: "Batsman", country: "India", basePrice: 0.30, set: 58 },

    // SET 59: UAL7 (Uncapped All Rounders 7)
    { name: "Krish Bhagat", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Sohraab Dhaliwal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Harsh Dubey", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Ramakrishna Ghosh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Raj Limbani", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Ninad Rathva", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Vivrant Sharma", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },
    { name: "Shiva Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 59 },

    // SET 60: UFA7 (Uncapped Fast Bowlers 7)
    { name: "Sayed Irfan Aftab", role: "Bowler", country: "India", basePrice: 0.30, set: 60 },
    { name: "Anirudh Chowdhary", role: "Bowler", country: "India", basePrice: 0.30, set: 60 },
    { name: "Anshuman Hooda", role: "Bowler", country: "India", basePrice: 0.30, set: 60 },
    { name: "Siddharth Kaul", role: "Bowler", country: "India", basePrice: 0.40, set: 60 },
    { name: "Prashant Sai Painkra", role: "Bowler", country: "India", basePrice: 0.30, set: 60 },
    { name: "Venkata Satyanarayana Penmetsa", role: "Bowler", country: "India", basePrice: 0.30, set: 60 },
    { name: "Yeddala Reddy", role: "Bowler", country: "India", basePrice: 0.30, set: 60 },

    // SET 61: AL8 (All Rounders 8)
    { name: "Zak Foulkes", role: "All-Rounder", country: "New Zealand", basePrice: 0.75, set: 61 },
    { name: "Chris Green", role: "All-Rounder", country: "Australia", basePrice: 1.0, set: 61 },
    { name: "Shakib Al Hasan", role: "All-Rounder", country: "Bangladesh", basePrice: 1.0, set: 61 },
    { name: "Mehidy Hasan Miraz", role: "All-Rounder", country: "Bangladesh", basePrice: 1.0, set: 61 },
    { name: "Wiaan Mulder", role: "All-Rounder", country: "South Africa", basePrice: 0.75, set: 61 },
    { name: "Dwaine Pretorius", role: "All-Rounder", country: "South Africa", basePrice: 0.75, set: 61 },
    { name: "Dasun Shanaka", role: "All-Rounder", country: "Sri Lanka", basePrice: 0.75, set: 61 },

    // SET 62: FA8 (Fast Bowlers 8)
    { name: "Shoriful Islam", role: "Bowler", country: "Bangladesh", basePrice: 0.75, set: 62 },
    { name: "Blessing Muzarabani", role: "Bowler", country: "Zimbabwe", basePrice: 0.75, set: 62 },
    { name: "Matthew Potts", role: "Bowler", country: "England", basePrice: 1.5, set: 62 },
    { name: "Tanzim Hasan Sakib", role: "Bowler", country: "Bangladesh", basePrice: 0.75, set: 62 },
    { name: "Benjamin Sears", role: "Bowler", country: "New Zealand", basePrice: 1.0, set: 62 },
    { name: "Tim Southee", role: "Bowler", country: "New Zealand", basePrice: 1.5, set: 62 },
    { name: "John Turner", role: "Bowler", country: "England", basePrice: 1.5, set: 62 },

    // SET 63: UBA8 (Uncapped Batters 8)
    { name: "Joshua Brown", role: "Batsman", country: "Australia", basePrice: 0.30, set: 63 },
    { name: "Oliver Davies", role: "Batsman", country: "Australia", basePrice: 0.30, set: 63 },
    { name: "Bevan John Jacobs", role: "Batsman", country: "New Zealand", basePrice: 0.30, set: 63 },
    { name: "Atharva Kale", role: "Batsman", country: "India", basePrice: 0.30, set: 63 },
    { name: "Abhishek Nair", role: "Batsman", country: "India", basePrice: 0.30, set: 63 },
    { name: "Vishwanath Pratap Singh", role: "Batsman", country: "India", basePrice: 0.30, set: 63 },

    // SET 64: UAL8 (Uncapped All Rounders 8)
    { name: "Nasir Lone", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },
    { name: "Brandon McMullen", role: "All-Rounder", country: "Scotland", basePrice: 0.30, set: 64 },
    { name: "S. Midhun", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },
    { name: "Abid Mushtaq", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },
    { name: "Mahesh Pithiya", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },
    { name: "Maramreddy Reddy", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },
    { name: "Atit Sheth", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },
    { name: "Jonty Sidhu", role: "All-Rounder", country: "India", basePrice: 0.30, set: 64 },

    // SET 65: UFA8 (Uncapped Fast Bowlers 8)
    { name: "Mohit Avasthi", role: "Bowler", country: "India", basePrice: 0.30, set: 65 },
    { name: "Faridoon Dawoodzai", role: "Bowler", country: "Afghanistan", basePrice: 0.30, set: 65 },
    { name: "Praful Hinge", role: "Bowler", country: "India", basePrice: 0.30, set: 65 },
    { name: "Pankaj Jaswal", role: "Bowler", country: "India", basePrice: 0.30, set: 65 },
    { name: "Vijay Kumar", role: "Bowler", country: "India", basePrice: 0.30, set: 65 },
    { name: "Ashok Sharma", role: "Bowler", country: "India", basePrice: 0.30, set: 65 },
    { name: "Mujtaba Yousuf", role: "Bowler", country: "India", basePrice: 0.30, set: 65 },

    // SET 66: AL9 (All Rounders 9)
    { name: "Ashton Agar", role: "All-Rounder", country: "Australia", basePrice: 1.25, set: 66 },
    { name: "Roston Chase", role: "All-Rounder", country: "West Indies", basePrice: 0.75, set: 66 },
    { name: "Junior Dala", role: "All-Rounder", country: "South Africa", basePrice: 0.75, set: 66 },
    { name: "Mahedi Hasan", role: "All-Rounder", country: "Bangladesh", basePrice: 0.75, set: 66 },
    { name: "Nangeyalia Kharote", role: "All-Rounder", country: "Afghanistan", basePrice: 0.75, set: 66 },
    { name: "Dan Lawrence", role: "All-Rounder", country: "England", basePrice: 1.00, set: 66 },
    { name: "Nathan Smith", role: "All-Rounder", country: "New Zealand", basePrice: 0.75, set: 66 },

    // SET 67: FA9 (Fast Bowlers 9)
    { name: "James Anderson", role: "Bowler", country: "England", basePrice: 1.25, set: 67 },
    { name: "Kyle Jamieson", role: "Bowler", country: "New Zealand", basePrice: 1.50, set: 67 },
    { name: "Chris Jordan", role: "Bowler", country: "England", basePrice: 2.00, set: 67 },
    { name: "Hasan Mahmud", role: "Bowler", country: "Bangladesh", basePrice: 0.75, set: 67 },
    { name: "Tymal Mills", role: "Bowler", country: "England", basePrice: 2.00, set: 67 },
    { name: "David Payne", role: "Bowler", country: "England", basePrice: 1.00, set: 67 },
    { name: "Nahid Rana", role: "Bowler", country: "Bangladesh", basePrice: 0.75, set: 67 },

    // SET 68: UBA9 (Uncapped Batters 9)
    { name: "Prayas Ray Barman", role: "Batsman", country: "India", basePrice: 0.30, set: 68 },
    { name: "Jafar Jamal", role: "Batsman", country: "India", basePrice: 0.30, set: 68 },
    { name: "Ayaz Khan", role: "Batsman", country: "India", basePrice: 0.30, set: 68 },
    { name: "Kaushik Maity", role: "Batsman", country: "India", basePrice: 0.30, set: 68 },
    { name: "Rituraj Sharma", role: "Batsman", country: "India", basePrice: 0.30, set: 68 },
    { name: "Vaibhav Suryavanshi", role: "Batsman", country: "India", basePrice: 0.30, set: 68 },

    // SET 69: UAL9 (Uncapped All Rounders 9)
    { name: "Kartik Chadha", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Writtick Chatterjee", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Prerit Dutta", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Rajneesh Gurbani", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Shubhang Hegde", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Saransh Jain", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Ripal Patel", "role": "All-Rounder", country: "India", basePrice: 0.30, set: 69 },
    { name: "Akash Vashisht", role: "All-Rounder", country: "India", basePrice: 0.30, set: 69 },

    // SET 70: UFA9 (Uncapped Fast Bowlers 9)
    { name: "Anirudh Kanwar", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },
    { name: "Shubham Kapse", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },
    { name: "Atif Mushtaq", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },
    { name: "Dipesh Parwani", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },
    { name: "Manish Reddy", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },
    { name: "Chetan Sharma", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },
    { name: "Avinash Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 70 },

    // SET 71: RESERVED/SKIPPED

    // SET 72: AL10 & FA10 (Mixed Set)
    { name: "Alick Athanaze", role: "All-Rounder", country: "West Indies", basePrice: 0.75, set: 72 },
    { name: "Hilton Cartwright", role: "All-Rounder", country: "Australia", basePrice: 0.75, set: 72 },
    { name: "Dominic Drakes", role: "All-Rounder", country: "West Indies", basePrice: 1.25, set: 72 },
    { name: "Daryn Dupavillon", role: "Bowler", country: "South Africa", basePrice: 0.75, set: 72 },
    { name: "Matthew Forde", role: "All-Rounder", country: "West Indies", basePrice: 1.25, set: 72 },
    { name: "Patrick Kruger", role: "All-Rounder", country: "South Africa", basePrice: 0.75, set: 72 },
    { name: "Lahiru Kumara", role: "Bowler", country: "Sri Lanka", basePrice: 0.75, set: 72 },
    { name: "Michael Neser", role: "All-Rounder", country: "Australia", basePrice: 0.75, set: 72 },
    { name: "Richard Ngarava", role: "Bowler", country: "Zimbabwe", basePrice: 0.75, set: 72 },
    { name: "Wayne Parnell", role: "Bowler", country: "South Africa", basePrice: 1.00, set: 72 },
    { name: "Keemo Paul", role: "All-Rounder", country: "West Indies", basePrice: 1.25, set: 72 },
    { name: "Odean Smith", role: "All-Rounder", country: "West Indies", basePrice: 0.75, set: 72 },
    { name: "Andrew Tye", role: "Bowler", country: "Australia", basePrice: 0.75, set: 72 },

    // SET 73: UAL10 (Uncapped All Rounders 10)
    { name: "Ajay Ahlawat", role: "All-Rounder", country: "India", basePrice: 0.30, set: 73 },
    { name: "Corbin Bosch", role: "All-Rounder", country: "South Africa", basePrice: 0.40, set: 73 },
    { name: "Mayank Gusain", role: "All-Rounder", country: "India", basePrice: 0.30, set: 73 },
    { name: "Mukhtar Hussain", role: "All-Rounder", country: "India", basePrice: 0.30, set: 73 },
    { name: "Girinath Reddy", role: "All-Rounder", country: "India", basePrice: 0.30, set: 73 },
    { name: "Jalaj Saxena", role: "All-Rounder", country: "India", basePrice: 0.40, set: 73 },
    { name: "Yajas Sharma", role: "All-Rounder", country: "India", basePrice: 0.30, set: 73 },
    { name: "Sanjay Yadav", role: "All-Rounder", country: "India", basePrice: 0.30, set: 73 },

    // SET 74: UFA10 (Uncapped Fast Bowlers 10)
    { name: "Vishal Godara", role: "Bowler", country: "India", basePrice: 0.30, set: 74 },
    { name: "Eshan Malinga", role: "Bowler", country: "Sri Lanka", basePrice: 0.30, set: 74 },
    { name: "Samarth Nagraj", role: "Bowler", country: "India", basePrice: 0.30, set: 74 },
    { name: "Abhishek Saini", role: "Bowler", country: "India", basePrice: 0.30, set: 74 },
    { name: "Dumindu Sewmina", role: "Bowler", country: "Sri Lanka", basePrice: 0.30, set: 74 },
    { name: "Pradyuman Kumar Singh", role: "Bowler", country: "India", basePrice: 0.30, set: 74 },
    { name: "Vasu Vats", role: "Bowler", country: "India", basePrice: 0.30, set: 74 },

    // SET 75: UAL11 (Uncapped All Rounders 11)
    { name: "Umang Kumar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Mohamed Ali", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Atharva Ankolekar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Vaisakh Chandran", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Auqib Dar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Rohit Rayudu", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Uday Saharan", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },
    { name: "Ayush Vartak", role: "All-Rounder", country: "India", basePrice: 0.30, set: 75 },

    // SET 76: UAL12 (Uncapped All Rounders 12)
    { name: "Baba Aparajith", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },
    { name: "Sumit Kumar Beniwal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },
    { name: "Nishunk Birla", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },
    { name: "Digvijay Deshmukh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },
    { name: "Lakshay Jain", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },
    { name: "Duan Jansen", role: "All-Rounder", country: "South Africa", basePrice: 0.30, set: 76 },
    { name: "Kritagya Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },
    { name: "P. Vignesh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 76 },

    // SET 77: UAL13 (Uncapped All Rounders 13)
    { name: "Sabhay Chadha", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },
    { name: "Ben Howell", role: "All-Rounder", country: "England", basePrice: 0.50, set: 77 },
    { name: "Hemanth Kumar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },
    { name: "Rohan Rana", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },
    { name: "Bharat Sharma", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },
    { name: "Pratham Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },
    { name: "Tripurana Vijay", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },
    { name: "Ravi Yadav", role: "All-Rounder", country: "India", basePrice: 0.30, set: 77 },

    // SET 78: UAL14 (Uncapped All Rounders 14)
    { name: "Arjun Azad", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Abhay Choudhary", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Gaurav Gambhir", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Shubham Garhwal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Tejasvi Jaiswal", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Sairaj Patil", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Madhav Tiwari", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },
    { name: "Kamal Tripathi", role: "All-Rounder", country: "India", basePrice: 0.30, set: 78 },

    // SET 79: UAL15 (Uncapped All Rounders 15)
    { name: "Prashant Chauhan", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Yash Dabas", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Dhruv Kaushik", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Khrievitso Kense", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Akash Parkar", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Vignesh Puthur", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Tripuresh Singh", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
    { name: "Vijay Yadav", role: "All-Rounder", country: "India", basePrice: 0.30, set: 79 },
];

const DB_PATH = path.join(__dirname, 'db.json');

function resetAndSeed() {
    console.log('🔄 Resetting Database...');

    let db = { teams: [], players: [], auctionState: {} };
    if (fs.existsSync(DB_PATH)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        } catch (e) {
            console.error('Failed to parse existing DB, starting fresh.');
        }
    }

    // Wipe Players
    console.log(`🗑️  Deleting ${db.players?.length || 0} existing players...`);
    db.players = [];

    // Reset Auction State, but PRESERVE settings
    // Crucial: Reset currentSet to 1 (M1)
    db.auctionState = {
        status: 'IDLE',
        currentPlayer: null,
        currentBid: 0,
        currentBidder: null,
        history: [],
        eventLog: [],
        isPaused: false,
        timerExpiresAt: null,
        rtmState: null,
        currentSet: 1,
        settings: db.auctionState?.settings || { defaultDuration: 60, resetDuration: 60 },
        nominations: { isOpen: false, submissions: [] },
        setOrder: [
            ...Array.from({ length: 70 }, (_, i) => i + 1),
            72, 73, 74, 75, 76, 77, 78, 79
        ]
    };

    // Keep Teams (assumed user wants to keep teams)
    // If teams should be cleared, uncomment: db.teams = [];

    // Seed New Players
    console.log(`🌱 Seeding ${REAL_PLAYERS.length} new players...`);

    // Helper ID generator
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const newPlayers = REAL_PLAYERS.map(p => ({
        id: generateId(),
        ...p,
        isForeign: p.country !== 'India',
        status: 'U',
        soldPrice: 0,
        soldTo: null
    }));

    db.players = newPlayers;

    // Save
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('✅ Database reset and seeded successfully!');
}

resetAndSeed();
