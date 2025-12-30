const mongoose = require('mongoose');
const { AuctionState } = require('./models');

console.log('EventLog Schema Type:', AuctionState.schema.path('eventLog'));
// Recursive inspection if it's an array
console.log('EventLog Array Type:', AuctionState.schema.path('eventLog').caster);
