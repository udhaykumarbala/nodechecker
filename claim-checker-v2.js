// Configuration
const CONFIG = {
    RPC_URL: 'https://evmrpc.0g.ai', // 0G Mainnet RPC
    ARBITRUM_RPC_URL: 'https://arb1.arbitrum.io/rpc', // Arbitrum RPC
    GRAPHQL_URL: 'https://alignment-node-subgraph.0g.ai/subgraphs/name/alignment-node', // GraphQL API
    CLAIM_CONTRACT_ADDRESS: '0x6a9c6b5507e322aa00eb9c45e80c07ab63acabb6', // MilestoneClaim on 0G
    NFT_CONTRACT_ADDRESS: '0xd0f4e1265edd221b5bb0e8667a59f31b587b2197', // NFT on Arbitrum
    CONTRACT_ABI: [
        {
            name: "allocationPerToken",
            type: "function",
            inputs: [],
            outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
            stateMutability: "view",
        },
        {
            name: "init_unlock",
            type: "function",
            inputs: [],
            outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
            stateMutability: "view",
        },
        {
            name: "partPercentage",
            type: "function",
            inputs: [],
            outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
            stateMutability: "view",
        },
        {
            name: "curPenalty",
            type: "function",
            inputs: [],
            outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
            stateMutability: "view",
        },
        {
            name: "claimData",
            type: "function",
            inputs: [{ name: "credential", type: "uint256", internalType: "uint256" }],
            outputs: [
                { name: "consumed", type: "uint256", internalType: "uint256" },
                { name: "claimed", type: "uint256", internalType: "uint256" },
            ],
            stateMutability: "view",
        },
        {
            name: "calculateAmount",
            type: "function",
            inputs: [
                { name: "_amount", type: "uint256", internalType: "uint256" },
                { name: "_penalty", type: "uint256", internalType: "uint256" },
                { name: "_consumed", type: "uint256", internalType: "uint256" },
                { name: "baseline", type: "uint256", internalType: "uint256" },
            ],
            outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
            stateMutability: "view",
        },
    ]
};

// NFT ABI (ERC721 with tokenURI)
const NFT_ABI = [
    {
        name: "tokenURI",
        type: "function",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
    },
    {
        name: "ownerOf",
        type: "function",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
    }
];

// Global variables
let provider;
let contract;
let arbitrumProvider;
let nftContract;

// Initialize provider and contract
async function init() {
    try {
        provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
        contract = new ethers.Contract(CONFIG.CLAIM_CONTRACT_ADDRESS, CONFIG.CONTRACT_ABI, provider);

        arbitrumProvider = new ethers.providers.JsonRpcProvider(CONFIG.ARBITRUM_RPC_URL);
        nftContract = new ethers.Contract(CONFIG.NFT_CONTRACT_ADDRESS, NFT_ABI, arbitrumProvider);

        console.log('Provider and contract initialized successfully');
        console.log('Connected to 0G Mainnet & Arbitrum');
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

// Fetch NFT data from GraphQL
async function getNFTGraphQLData(tokenId) {
    try {
        const query = `
            query {
                nfts(where: {tokenId: "${tokenId}"}) {
                    id
                    tokenId
                    delegatedTime
                    approvedTime
                    undelegatedTime
                    lastUpdatedTime
                    totalReward
                }
            }
        `;

        const response = await fetch(CONFIG.GRAPHQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const result = await response.json();

        if (result.data && result.data.nfts && result.data.nfts.length > 0) {
            const nftData = result.data.nfts[0];

            // Determine if node is running
            const delegatedTime = nftData.delegatedTime ? parseInt(nftData.delegatedTime) : 0;
            const approvedTime = nftData.approvedTime ? parseInt(nftData.approvedTime) : 0;
            const undelegatedTime = nftData.undelegatedTime ? parseInt(nftData.undelegatedTime) : null;

            const isRunning = undelegatedTime === null ||
                             (delegatedTime > 0 && delegatedTime > undelegatedTime) ||
                             (approvedTime > 0 && approvedTime > undelegatedTime);

            return {
                totalReward: nftData.totalReward ? ethers.BigNumber.from(nftData.totalReward) : ethers.BigNumber.from(0),
                isRunning,
                lastUpdatedTime: nftData.lastUpdatedTime ? parseInt(nftData.lastUpdatedTime) : null
            };
        }

        return {
            totalReward: ethers.BigNumber.from(0),
            isRunning: false,
            lastUpdatedTime: null
        };
    } catch (error) {
        console.warn('Could not fetch GraphQL data:', error);
        return {
            totalReward: ethers.BigNumber.from(0),
            isRunning: false,
            lastUpdatedTime: null
        };
    }
}

// Fetch NFT metadata
async function getNFTMetadata(tokenId) {
    try {
        const [tokenURI, owner] = await Promise.all([
            nftContract.tokenURI(tokenId),
            nftContract.ownerOf(tokenId)
        ]);

        // Fetch metadata from tokenURI
        let metadata = { name: `AI Alignment Node #${tokenId}`, image: null };

        if (tokenURI) {
            try {
                // Handle IPFS URLs
                let metadataURL = tokenURI;
                if (tokenURI.startsWith('ipfs://')) {
                    metadataURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }

                const response = await fetch(metadataURL);
                const data = await response.json();

                if (data.name) metadata.name = data.name;
                if (data.image) {
                    metadata.image = data.image;
                    if (metadata.image.startsWith('ipfs://')) {
                        metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    }
                }
            } catch (err) {
                console.warn('Could not fetch metadata from tokenURI:', err);
            }
        }

        return { ...metadata, owner };
    } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return { name: `AI Alignment Node #${tokenId}`, image: null, owner: null };
    }
}

// Utility functions
function formatEther(value) {
    return ethers.utils.formatEther(value);
}

function formatNumber(num) {
    const numStr = parseFloat(num).toFixed(2);
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// State management
function showLoading() {
    const button = document.getElementById('searchButton');
    button.disabled = true;
    button.innerHTML = '<span class="button-spinner"></span> Checking...';

    document.getElementById('errorState').classList.remove('active');
    document.getElementById('results').classList.remove('active');
    document.getElementById('skeletonLoading').classList.add('active');
}

function hideLoading() {
    const button = document.getElementById('searchButton');
    button.disabled = false;
    button.innerHTML = 'Check Status';

    document.getElementById('skeletonLoading').classList.remove('active');
}

function showError(message) {
    document.getElementById('errorState').classList.add('active');
    document.getElementById('errorMessage').textContent = message;
    hideLoading();
}

function showResults() {
    document.getElementById('errorState').classList.remove('active');
    document.getElementById('results').classList.add('active');
    hideLoading();

    // Trigger animations
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach(el => {
            const width = el.style.width;
            el.style.width = '0%';
            setTimeout(() => {
                el.style.width = width;
            }, 100);
        });
    }, 100);
}

// Calculate penalty-adjusted amount
function calculatePenaltyAdjustedAmount(amount, penalty, consumed, baseline) {
    const ONE_ETHER = ethers.utils.parseEther('1');
    const penaltyMultiplier = ONE_ETHER.sub(penalty);

    if (consumed.add(amount).lte(baseline)) {
        return amount;
    } else if (consumed.gte(baseline)) {
        return amount.mul(penaltyMultiplier).div(ONE_ETHER);
    } else {
        const penaltyFreeAmount = baseline.sub(consumed);
        const penaltyAmount = amount.sub(penaltyFreeAmount);
        const penaltyAdjusted = penaltyAmount.mul(penaltyMultiplier).div(ONE_ETHER);
        return penaltyFreeAmount.add(penaltyAdjusted);
    }
}

// Get NFT claim data
async function getNFTClaimData(nftId) {
    try {
        showLoading();

        console.log(`Fetching data for NFT ID: ${nftId}`);

        // Fetch contract data, NFT metadata, and GraphQL data in parallel
        const [
            allocationPerToken,
            initUnlock,
            partPercentage,
            currentPenalty,
            claimData,
            nftMetadata,
            graphqlData
        ] = await Promise.all([
            contract.allocationPerToken(),
            contract.init_unlock(),
            contract.partPercentage(),
            contract.curPenalty(),
            contract.claimData(nftId),
            getNFTMetadata(nftId),
            getNFTGraphQLData(nftId)
        ]);

        // Hardcode milestone schedule
        const TGE_TIMESTAMP = 1758412800; // Sep 21, 2025 00:00:00 GMT
        const milestones = [
            {
                timestamp: TGE_TIMESTAMP,
                penalty: ethers.utils.parseEther('0.6') // 60%
            },
            {
                timestamp: TGE_TIMESTAMP + (90 * 24 * 60 * 60), // Dec 20, 2025
                penalty: ethers.utils.parseEther('0.5') // 50%
            },
            {
                timestamp: TGE_TIMESTAMP + (180 * 24 * 60 * 60), // Mar 20, 2026
                penalty: ethers.utils.parseEther('0.35') // 35%
            },
            {
                timestamp: TGE_TIMESTAMP + (270 * 24 * 60 * 60), // Jun 18, 2026
                penalty: ethers.utils.parseEther('0.2') // 20%
            },
            {
                timestamp: TGE_TIMESTAMP + (365 * 24 * 60 * 60), // Sep 21, 2026
                penalty: ethers.utils.parseEther('0') // 0%
            }
        ];

        const ONE_ETHER = ethers.utils.parseEther('1');

        // Parse claim data
        const consumed = claimData.consumed;
        const claimed = claimData.claimed;

        // Calculate Part 1 values
        const baseline = allocationPerToken.mul(initUnlock).div(ONE_ETHER);
        const part1Total = allocationPerToken.mul(partPercentage).div(ONE_ETHER);
        const part1RemainingShare = part1Total.sub(consumed);

        // Calculate max claimable amount (with current penalty)
        let part1RemainingClaimable;
        if (part1RemainingShare.lte(0)) {
            part1RemainingClaimable = ethers.BigNumber.from(0);
        } else {
            try {
                part1RemainingClaimable = await contract.calculateAmount(
                    part1RemainingShare,
                    currentPenalty,
                    consumed,
                    baseline
                );
            } catch (error) {
                console.warn('Could not calculate claimable amount:', error);
                part1RemainingClaimable = ethers.BigNumber.from(0);
            }
        }

        // Calculate Part 2 values
        const part2Percentage = ONE_ETHER.sub(partPercentage);
        const part2Total = allocationPerToken.mul(part2Percentage).div(ONE_ETHER);

        // Display all data
        displayData({
            nftId,
            nftMetadata,
            graphqlData,
            allocationPerToken,
            currentPenalty,
            part1: {
                total: part1Total,
                penaltyFree: baseline,
                consumed,
                claimed,
                remainingShare: part1RemainingShare,
                remainingClaimable: part1RemainingClaimable
            },
            part2: {
                total: part2Total,
                earned: graphqlData.totalReward,
                isRunning: graphqlData.isRunning,
                lastUpdated: graphqlData.lastUpdatedTime
            },
            milestones
        });

        showResults();
    } catch (error) {
        console.error('Error fetching NFT data:', error);
        if (error.message.includes('invalid BigNumber string')) {
            showError('Invalid NFT ID. Please enter a valid number.');
        } else if (error.message.includes('could not detect network')) {
            showError('Could not connect to 0G Network. Please check your internet connection.');
        } else {
            showError(`Error: ${error.message || 'Failed to fetch NFT data. Please try again.'}`);
        }
    }
}

// Display all data
function displayData(data) {
    displayHeroSummary(data);
    displayRecommendation(data);
    displaySplitCards(data);
    displayTimeline(data);
}

// Display Hero Summary Card
function displayHeroSummary(data) {
    const heroSummary = document.getElementById('heroSummary');

    // Calculate remaining amounts
    const part2Remaining = data.part2.total.sub(data.part2.earned);
    const totalRemaining = data.part1.remainingShare.add(part2Remaining);

    // NFT image or placeholder
    const imageHTML = data.nftMetadata && data.nftMetadata.image
        ? `<img src="${data.nftMetadata.image}" alt="${data.nftMetadata.name}" />`
        : `<div class="nft-placeholder">🎯</div>`;

    // Node status badge
    const statusBadge = data.part2.isRunning
        ? '<span class="status-badge running">🟢 Node Running</span>'
        : '<span class="status-badge stopped">🔴 Node Stopped</span>';

    // Format owner
    const owner = data.nftMetadata && data.nftMetadata.owner
        ? data.nftMetadata.owner.substring(0, 6) + '...' + data.nftMetadata.owner.substring(38)
        : 'Unknown';

    heroSummary.innerHTML = `
        <div class="nft-image-section">
            ${imageHTML}
            <div class="nft-info">
                <div class="nft-name">${data.nftMetadata ? data.nftMetadata.name : 'AI Alignment Node #' + data.nftId}</div>
                <div class="nft-owner">Owner: ${owner}</div>
                <a href="https://opensea.io/assets/arbitrum/${CONFIG.NFT_CONTRACT_ADDRESS}/${data.nftId}"
                   target="_blank" class="opensea-link">View on OpenSea →</a>
            </div>
        </div>
        <div class="summary-main">
            <div class="summary-label">💰 Total Remaining</div>
            <div class="hero-amount">${formatNumber(formatEther(totalRemaining))} <span class="token-symbol">0G</span></div>
            ${statusBadge}
        </div>
    `;
}

// Display Smart Recommendation
function displayRecommendation(data) {
    const recommendation = document.getElementById('recommendation');

    // Don't show recommendation if nothing left to claim
    if (data.part1.remainingShare.eq(0)) {
        recommendation.style.display = 'none';
        return;
    }

    recommendation.style.display = 'block';

    const now = Math.floor(Date.now() / 1000);
    const currentPenaltyPercent = parseFloat(formatEther(data.currentPenalty)) * 100;

    // Find next milestone
    let nextMilestone = null;
    for (const milestone of data.milestones) {
        if (milestone.timestamp > now) {
            nextMilestone = milestone;
            break;
        }
    }

    if (!nextMilestone || currentPenaltyPercent <= 20) {
        // Already at low penalty or no future milestones
        recommendation.innerHTML = `
            <div class="recommendation-icon">💡</div>
            <div class="recommendation-content">
                <div class="recommendation-title">Good Time to Claim</div>
                <div class="recommendation-text">
                    Current penalty is ${currentPenaltyPercent.toFixed(0)}%. You can claim now or wait for even lower penalties.
                </div>
            </div>
        `;
        return;
    }

    // Calculate savings
    const nextPenaltyPercent = parseFloat(formatEther(nextMilestone.penalty)) * 100;
    const currentClaimable = data.part1.remainingClaimable;
    const futureClaimable = calculatePenaltyAdjustedAmount(
        data.part1.remainingShare,
        nextMilestone.penalty,
        data.part1.consumed,
        data.part1.penaltyFree
    );
    const savings = futureClaimable.sub(currentClaimable);
    const daysToWait = Math.ceil((nextMilestone.timestamp - now) / (24 * 60 * 60));

    recommendation.innerHTML = `
        <div class="recommendation-icon">💡</div>
        <div class="recommendation-content">
            <div class="recommendation-title">Smart Recommendation</div>
            <div class="recommendation-text">
                Wait <strong>${daysToWait} days</strong> to save <strong>${formatNumber(formatEther(savings))} 0G</strong>
                <br />
                Penalty drops from ${currentPenaltyPercent.toFixed(0)}% → ${nextPenaltyPercent.toFixed(0)}%
            </div>
            <div class="recommendation-date">
                📅 Best claim date: ${formatDate(nextMilestone.timestamp)}
            </div>
        </div>
    `;
}

// Display Split Cards (Part 1 & Part 2)
function displaySplitCards(data) {
    const part1Card = document.getElementById('part1Card');
    const part2Card = document.getElementById('part2Card');

    // Part 1 Card
    const part1ProgressPercent = data.part1.total.gt(0)
        ? parseFloat(formatEther(data.part1.claimed)) / parseFloat(formatEther(data.part1.total)) * 100
        : 0;

    const currentPenaltyPercent = parseFloat(formatEther(data.currentPenalty)) * 100;

    part1Card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">📊</div>
            <div class="card-title">Part 1: Milestone Claims</div>
        </div>
        <div class="card-amount">${formatNumber(formatEther(data.part1.remainingShare))} <span class="token-symbol">0G</span></div>
        <div class="card-label">Remaining</div>

        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${part1ProgressPercent}%"></div>
            </div>
            <div class="progress-info">
                <span>Claimed: ${part1ProgressPercent.toFixed(1)}%</span>
                <span>${formatNumber(formatEther(data.part1.claimed))} 0G</span>
            </div>
        </div>

        <div class="expand-button" onclick="toggleExpand('part1')">
            <span id="part1ExpandText">Show Details</span>
            <span class="expand-arrow" id="part1ExpandArrow">▼</span>
        </div>

        <div class="expand-content" id="part1ExpandContent">
            <div class="detail-item">
                <span>Total Allocation</span>
                <strong>${formatNumber(formatEther(data.part1.total))} 0G</strong>
            </div>
            <div class="detail-item">
                <span>Claimable Now</span>
                <strong>${formatNumber(formatEther(data.part1.remainingClaimable))} 0G</strong>
            </div>
            <div class="detail-item">
                <span>Current Penalty</span>
                <strong style="color: #F59E0B;">${currentPenaltyPercent.toFixed(0)}%</strong>
            </div>
            <div class="detail-item">
                <span>Already Claimed</span>
                <strong>${formatNumber(formatEther(data.part1.claimed))} 0G</strong>
            </div>
        </div>
    `;

    // Part 2 Card
    const part2Remaining = data.part2.total.sub(data.part2.earned);
    const part2ProgressPercent = data.part2.total.gt(0)
        ? parseFloat(formatEther(data.part2.earned)) / parseFloat(formatEther(data.part2.total)) * 100
        : 0;

    // Circular progress SVG
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (part2ProgressPercent / 100) * circumference;

    part2Card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">🚀</div>
            <div class="card-title">Part 2: Vesting Rewards</div>
        </div>
        <div class="card-amount">${formatNumber(formatEther(part2Remaining))} <span class="token-symbol">0G</span></div>
        <div class="card-label">Remaining to Earn</div>

        <div class="circular-progress">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#E5E7EB" stroke-width="8"/>
                <circle cx="60" cy="60" r="${radius}" fill="none" stroke="url(#gradient)" stroke-width="8"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        transform="rotate(-90 60 60)"/>
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
            <div class="circular-text">${part2ProgressPercent.toFixed(0)}%<br/><span>Earned</span></div>
        </div>

        <div class="expand-button" onclick="toggleExpand('part2')">
            <span id="part2ExpandText">Show Details</span>
            <span class="expand-arrow" id="part2ExpandArrow">▼</span>
        </div>

        <div class="expand-content" id="part2ExpandContent">
            <div class="detail-item">
                <span>Total Allocation</span>
                <strong>${formatNumber(formatEther(data.part2.total))} 0G</strong>
            </div>
            <div class="detail-item">
                <span>Already Earned</span>
                <strong style="color: #10B981;">${formatNumber(formatEther(data.part2.earned))} 0G</strong>
            </div>
            <div class="detail-item">
                <span>Vesting Period</span>
                <strong>36 Months</strong>
            </div>
            <div class="detail-item">
                <span>Node Status</span>
                <strong>${data.part2.isRunning ? '<span style="color: #10B981;">🟢 Running</span>' : '<span style="color: #EF4444;">🔴 Stopped</span>'}</strong>
            </div>
        </div>
    `;
}

// Display Interactive Timeline
function displayTimeline(data) {
    const timelineSection = document.getElementById('timelineSection');

    const now = Math.floor(Date.now() / 1000);
    let dotsHTML = '';

    data.milestones.forEach((milestone, index) => {
        const isPast = now > milestone.timestamp;
        const isCurrent = !isPast && (index === 0 || now > data.milestones[index - 1].timestamp);
        const dotClass = isPast ? 'completed' : (isCurrent ? 'current' : 'future');
        const penaltyPercent = (parseFloat(formatEther(milestone.penalty)) * 100).toFixed(0);

        dotsHTML += `
            <div class="timeline-item">
                <div class="timeline-dot ${dotClass}"></div>
                <div class="timeline-label">${formatDate(milestone.timestamp)}</div>
                <div class="timeline-penalty">${penaltyPercent}% penalty</div>
            </div>
        `;
    });

    timelineSection.innerHTML = `
        <div class="timeline-header">
            <div class="timeline-title">📅 Claim Schedule</div>
        </div>
        <div class="timeline-container">
            <div class="timeline-line"></div>
            <div class="timeline-items">
                ${dotsHTML}
            </div>
        </div>
    `;
}

// Toggle expand/collapse
function toggleExpand(cardName) {
    const content = document.getElementById(cardName + 'ExpandContent');
    const text = document.getElementById(cardName + 'ExpandText');
    const arrow = document.getElementById(cardName + 'ExpandArrow');

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        text.textContent = 'Show Details';
        arrow.textContent = '▼';
    } else {
        content.classList.add('active');
        text.textContent = 'Hide Details';
        arrow.textContent = '▲';
    }
}

// Handle form submission
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nftId = document.getElementById('nftIdInput').value.trim();

    if (!nftId || isNaN(nftId)) {
        showError('Please enter a valid NFT ID (numbers only).');
        return;
    }

    await getNFTClaimData(nftId);
});

// Initialize on page load
window.addEventListener('load', async () => {
    try {
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers.js library failed to load');
        }
        await init();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
});

// Make functions available globally
window.toggleExpand = toggleExpand;
