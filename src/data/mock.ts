import type { Team, Player } from '../types';

export const INITIAL_TEAMS: Team[] = [
    {
        id: 'csk',
        name: 'Chennai Super Kings',
        code: 'CSK',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/1200px-Chennai_Super_Kings_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#F9CD05' // Yellow
    },
    {
        id: 'mi',
        name: 'Mumbai Indians',
        code: 'MI',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/1200px-Mumbai_Indians_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#004BA0' // Blue
    },
    {
        id: 'rcb',
        name: 'Royal Challengers Bengaluru',
        code: 'RCB',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Royal_Challengers_Bangalore_2020.svg/1200px-Royal_Challengers_Bangalore_2020.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#EC1C24' // Red
    },
    {
        id: 'kkr',
        name: 'Kolkata Knight Riders',
        code: 'KKR',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/1200px-Kolkata_Knight_Riders_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#3A225D' // Purple
    },
    {
        id: 'srh',
        name: 'Sunrisers Hyderabad',
        code: 'SRH',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/1200px-Sunrisers_Hyderabad.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#F78F2E' // Orange
    },
    {
        id: 'dc',
        name: 'Delhi Capitals',
        code: 'DC',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f8/Delhi_Capitals_Logo.svg/1200px-Delhi_Capitals_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#00008B' // Blue
    },
    {
        id: 'pk',
        name: 'Punjab Kings',
        code: 'PBKS',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/1200px-Punjab_Kings_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#DD1F2D' // Red
    },
    {
        id: 'rr',
        name: 'Rajasthan Royals',
        code: 'RR',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/1200px-Rajasthan_Royals_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#EA1A85' // Pink
    },
    {
        id: 'gt',
        name: 'Gujarat Titans',
        code: 'GT',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/1200px-Gujarat_Titans_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#1B2133' // Navy
    },
    {
        id: 'lsg',
        name: 'Lucknow Super Giants',
        code: 'LSG',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_IPL_Logo.svg/1200px-Lucknow_Super_Giants_IPL_Logo.svg.png',
        purse: 100,
        purseUsed: 0,
        squadCount: 0,
        foreignPlayers: 0,
        rtmCardsLeft: 2,
        color: '#A0CEF5' // Cyan
    }
];

export const INITIAL_PLAYERS: Player[] = [
    { id: 'p1', name: 'Virat Kohli', role: 'Batsman', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p2', name: 'Rohit Sharma', role: 'Batsman', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p3', name: 'Travis Head', role: 'Batsman', country: 'Australia', basePrice: 2.0, isForeign: true, status: 'U', set: 1 },
    { id: 'p4', name: 'Jasprit Bumrah', role: 'Bowler', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p5', name: 'Rashid Khan', role: 'Bowler', country: 'Afghanistan', basePrice: 2.0, isForeign: true, status: 'U', set: 1 },
    { id: 'p6', name: 'Hardik Pandya', role: 'All-Rounder', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p7', name: 'Shreyas Iyer', role: 'Batsman', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p8', name: 'Rishabh Pant', role: 'Wicket Keeper', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p9', name: 'K.L. Rahul', role: 'Wicket Keeper', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
    { id: 'p10', name: 'Mohammed Shami', role: 'Bowler', country: 'India', basePrice: 2.0, isForeign: false, status: 'U', set: 1 },
];
