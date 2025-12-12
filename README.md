# 0G AI Alignment Node - NFT Claim Checker

A web-based tool to check the claim status of 0G AI Alignment Node NFTs, including Part 1 (milestone-based) and Part 2 (linear vesting) reward information.

## Features

- **Real-time Blockchain Data**: Fetches live data from the 0G Network
- **Part 1 Claims**: View milestone-based claim details with penalty information
- **Part 2 Information**: Display linear vesting allocation over 36 months
- **Milestone Schedule**: See all milestones with dates, penalties, and current status
- **Clean UI**: Modern, responsive design for easy viewing on any device

## What You Can Check

### Part 1: Milestone-Based Claims (33% of total rewards)
- Total Part 1 allocation per NFT
- Penalty-free amount (10% initial unlock)
- Already consumed and claimed amounts
- Remaining claimable amount (after current penalty)
- Complete milestone schedule with early withdrawal fees

### Part 2: Linear Vesting (67% of total rewards)
- Total Part 2 allocation per NFT
- Vesting period (36 months)
- Approximate daily distribution rate
- Important notes about active node participation requirements

## How to Use

### Option 1: Open Directly in Browser
1. Simply open `index.html` in any modern web browser
2. Enter an NFT ID (e.g., 122220)
3. Click "Check Status"
4. View all claim information

### Option 2: Run with Local Server (Recommended)
```bash
# Using Python 3
python3 -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Or using Node.js
npx http-server
```

Then open http://localhost:8000 in your browser.

## Example NFT IDs to Test

You can test with any valid 0G AI Alignment Node NFT ID. Some examples:
- 122220
- 100000
- 150000

## Understanding the Data

### Total Allocation
Each NFT has a total allocation of approximately **854.70 0G tokens**:
- Part 1: 282.05 0G (33%)
- Part 2: 572.65 0G (67%)

### Early Withdrawal Penalties (Part 1)

The penalty structure decreases over time:
- **TGE Day**: 60% penalty
- **After 90 days**: 50% penalty
- **After 180 days**: 35% penalty
- **After 270 days**: 20% penalty
- **After 365 days**: 0% penalty (fully unlocked)

### Important Notes

1. **Part 1** can be claimed at any time, but early withdrawals incur penalties based on the current milestone
2. **Part 2** rewards are distributed linearly over 36 months
3. Part 2 requires **active node participation** - rewards may be reduced if the node is offline
4. The penalty-free amount (10% = ~85.47 0G) can be claimed immediately without fees

## Technical Details

### Smart Contracts

**MilestoneClaim Contract (Claim Logic)**
- **Address**: `0x6a9c6b5507e322aa00eb9c45e80c07ab63acabb6`
- **Network**: 0G Mainnet
- **RPC URL**: `https://evmrpc.0g.ai`

**NFT Contract (AI Alignment Node NFTs)**
- **Address**: `0xd0f4e1265edd221b5bb0e8667a59f31b587b2197`
- **Network**: Arbitrum One
- **Block Explorer**: [View on Arbiscan](https://arbiscan.io/address/0xd0f4e1265edd221b5bb0e8667a59f31b587b2197)

**Architecture**: Multi-chain setup where NFTs live on Arbitrum but all claim logic/data is on 0G Mainnet. The claim contract uses NFT IDs as credentials to track claims.

### Dependencies
- Ethers.js v5.7.2 (loaded via CDN)
- No build process required
- Pure vanilla JavaScript

### Files
- `index.html` - Main web page with UI
- `claim-checker.js` - Contract interaction and calculation logic
- `README.md` - This file

## Browser Compatibility

Works with all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Troubleshooting

### "Could not connect to 0G Network"
- Check your internet connection
- The 0G RPC endpoint might be temporarily unavailable
- Try again in a few moments

### "Invalid NFT ID"
- Make sure you're entering only numbers
- Verify the NFT ID exists on the 0G Network
- Check on [OpenSea](https://opensea.io/collection/0g-lunarians) if unsure

### Data Not Loading
- Refresh the page
- Check browser console for errors (F12)
- Ensure JavaScript is enabled in your browser

## Resources

- [0G AI Alignment Node User Guide](https://docs.0g.ai/node-sale/ai-alignment-node-user-guide)
- [Rewards Distribution Schedule](https://0g.ai/blog/ai-alignment-node-rewards-distribution-schedule-eligibility)
- [0G Lunarians on OpenSea](https://opensea.io/collection/0g-lunarians)
- [0G Official Website](https://0g.ai)

## License

MIT

## Disclaimer

This tool is provided as-is for informational purposes. Always verify critical information directly on the blockchain or through official 0G channels.
