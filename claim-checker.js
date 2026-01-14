// Configuration
const CONFIG = {
    RPC_URL: 'https://evmrpc.0g.ai', // 0G Mainnet RPC
    GRAPHQL_URL: 'https://alignment-node-subgraph.0g.ai/subgraphs/name/alignment-node', // GraphQL API
    CLAIM_CONTRACT_ADDRESS: '0x6a9c6b5507e322aa00eb9c45e80c07ab63acabb6', // MilestoneClaim on 0G
    NFT_CONTRACT_ADDRESS: '0x18e56e7b120c7CBD06117A36E94E61a932A5A302', // NFT on 0G
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
let nftContract;
let currentNFTData = null; // Store current NFT data for mobile timeline interaction

// Initialize provider and contract
async function init() {
    try {
        provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
        contract = new ethers.Contract(CONFIG.CLAIM_CONTRACT_ADDRESS, CONFIG.CONTRACT_ABI, provider);
        nftContract = new ethers.Contract(CONFIG.NFT_CONTRACT_ADDRESS, NFT_ABI, provider);

        console.log('Provider and contract initialized successfully');
        console.log('Connected to 0G Mainnet');
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
                nft(id: "${tokenId}") {
                    id
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

        if (result.data && result.data.nft) {
            const nftData = result.data.nft;

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

    // Initialize tab indicator position
    setTimeout(() => initTabIndicator(), 100);
}

// Initialize tab indicator position
function initTabIndicator() {
    // Initialize desktop tab indicator
    const activeTab = document.querySelector('.tab.active');
    const indicator = document.getElementById('tabIndicator');
    const tabsContainer = document.getElementById('tabs');

    if (activeTab && indicator && tabsContainer) {
        const tabRect = activeTab.getBoundingClientRect();
        const containerRect = tabsContainer.getBoundingClientRect();

        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;

        // Set initial position without transition
        indicator.style.transition = 'none';
        indicator.style.width = width + 'px';
        indicator.style.transform = `translateX(${left}px)`;

        // Re-enable transition after a frame
        setTimeout(() => {
            indicator.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 50);
    }

    // Initialize mobile tab indicator
    const activeMobileTab = document.querySelector('.mobile-tab-btn.active');
    const mobileIndicator = document.getElementById('mobileTabIndicator');
    const mobileTabsContainer = document.getElementById('mobileTabs');

    if (activeMobileTab && mobileIndicator && mobileTabsContainer) {
        const tabRect = activeMobileTab.getBoundingClientRect();
        const containerRect = mobileTabsContainer.getBoundingClientRect();

        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;

        // Set initial position without transition
        mobileIndicator.style.transition = 'none';
        mobileIndicator.style.width = width + 'px';
        mobileIndicator.style.transform = `translateX(${left}px)`;

        // Re-enable transition after a frame
        setTimeout(() => {
            mobileIndicator.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 50);
    }
}

// Tab switching with animated indicator
function switchTab(tabName) {
    const clickedTab = event.target;

    // Update desktop tabs
    const allDesktopTabs = document.querySelectorAll('.tab');
    allDesktopTabs.forEach(tab => tab.classList.remove('active'));

    // Update mobile tabs
    const allMobileTabs = document.querySelectorAll('.mobile-tab-btn');
    allMobileTabs.forEach(tab => tab.classList.remove('active'));

    // Set clicked tab as active
    clickedTab.classList.add('active');

    // Animate indicator for desktop tabs
    if (clickedTab.classList.contains('tab')) {
        const indicator = document.getElementById('tabIndicator');
        const tabRect = clickedTab.getBoundingClientRect();
        const tabsContainer = document.getElementById('tabs');
        const containerRect = tabsContainer.getBoundingClientRect();

        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;

        indicator.style.width = width + 'px';
        indicator.style.transform = `translateX(${left}px)`;
    }

    // Animate indicator for mobile tabs
    if (clickedTab.classList.contains('mobile-tab-btn')) {
        const mobileIndicator = document.getElementById('mobileTabIndicator');
        const tabRect = clickedTab.getBoundingClientRect();
        const tabsContainer = document.getElementById('mobileTabs');
        const containerRect = tabsContainer.getBoundingClientRect();

        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;

        mobileIndicator.style.width = width + 'px';
        mobileIndicator.style.transform = `translateX(${left}px)`;
    }

    // Switch tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Content').classList.add('active');
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

        console.log('Contract data fetched:', {
            allocationPerToken: allocationPerToken.toString(),
            initUnlock: initUnlock.toString(),
            partPercentage: partPercentage.toString(),
            currentPenalty: currentPenalty.toString(),
            consumed: claimData.consumed.toString(),
            claimed: claimData.claimed.toString()
        });

        console.log('GraphQL data fetched:', {
            totalReward: graphqlData.totalReward.toString(),
            isRunning: graphqlData.isRunning,
            lastUpdatedTime: graphqlData.lastUpdatedTime
        });

        // Hardcode milestone schedule
        // Part 1 claim started on September 21, 2025
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
        const part2DailyRate = part2Total.div(ethers.BigNumber.from(36 * 30));

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
                dailyRate: part2DailyRate,
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
    // Store data globally for mobile interactions
    currentNFTData = data;

    // Desktop Hero Claim Card
    displayHeroClaimCard(data);

    // Mobile Value Card
    displayMobileHeroCard(data);

    // Mobile Milestones (vertical cards)
    displayMobileTimeline(data);

    // Desktop Combined Vertical Timeline with Milestones
    displayCombinedTimeline(data);

    // Desktop Part 2 Grid
    displayPart2Grid(data);

    // Mobile Part 2 Card
    displayMobilePart2(data);
}

// Display Hero Claim Card - Total Remaining and Allocated
function displayHeroClaimCard(data) {
    const heroCard = document.getElementById('nftHeroCard');

    // Calculate total remaining (Part 1 + Part 2)
    const part2Remaining = data.part2.total.sub(data.part2.earned);
    const totalRemaining = data.part1.remainingShare.add(part2Remaining);

    // Total allocated
    const totalAllocated = data.allocationPerToken;

    // NFT image or placeholder
    const imageHTML = data.nftMetadata && data.nftMetadata.image
        ? `<img src="${data.nftMetadata.image}" class="nft-image" alt="${data.nftMetadata.name}" />`
        : `<div class="nft-placeholder">🎯</div>`;

    heroCard.innerHTML = `
        <div class="nft-hero">
            <div class="nft-hero-content">
                <div class="nft-image-wrapper">
                    ${imageHTML}
                </div>
                <div class="nft-details">
                    <div class="nft-header">
                        <div class="nft-title">${data.nftMetadata ? data.nftMetadata.name : 'AI Alignment Node #' + data.nftId}</div>
                        <a href="https://chainscan.0g.ai/nft/${CONFIG.NFT_CONTRACT_ADDRESS}/${data.nftId}"
                           target="_blank" class="opensea-link">View on Explorer →</a>
                    </div>
                    <div class="allocation-section">
                        <div class="allocation-label">💰 Total Remaining / Total Allocated</div>
                        <div class="allocation-ratio">
                            <span class="ratio-remaining">${formatNumber(formatEther(totalRemaining))} 0G</span>
                            <span class="ratio-separator">/</span>
                            <span class="ratio-allocated">${formatNumber(formatEther(totalAllocated))} 0G</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display Mobile Value Card - Buyer-focused summary
function displayMobileHeroCard(data) {
    const mobileHeroCard = document.getElementById('mobileHeroCard');
    if (!mobileHeroCard) return;

    const now = Math.floor(Date.now() / 1000);

    // Calculate total remaining (Part 1 + Part 2)
    const part2Remaining = data.part2.total.sub(data.part2.earned);
    const totalRemaining = data.part1.remainingShare.add(part2Remaining);
    const totalAllocated = data.allocationPerToken;

    // Find current milestone and penalty
    let currentMilestone = data.milestones[0];
    let bestMilestone = data.milestones[data.milestones.length - 1];
    for (let i = 0; i < data.milestones.length; i++) {
        if (now >= data.milestones[i].timestamp) {
            currentMilestone = data.milestones[i];
        }
        if (data.milestones[i].penalty.eq(0)) {
            bestMilestone = data.milestones[i];
            break;
        }
    }

    const currentPenaltyPercent = parseFloat(formatEther(currentMilestone.penalty)) * 100;
    const bestDate = formatDate(bestMilestone.timestamp);

    // Penalty status
    let penaltyClass = 'high';
    let penaltyHint = 'Wait for better rate';
    if (currentPenaltyPercent === 0) {
        penaltyClass = 'good';
        penaltyHint = 'Best time to claim!';
    } else if (currentPenaltyPercent < 20) {
        penaltyClass = 'good';
        penaltyHint = `${bestDate} = 0%`;
    } else if (currentPenaltyPercent < 35) {
        penaltyClass = 'medium';
        penaltyHint = `${bestDate} = 0%`;
    }

    // Node status
    const nodeStatusClass = data.part2.isRunning ? 'running' : 'stopped';
    const nodeStatusIcon = data.part2.isRunning ? '🟢' : '🔴';
    const nodeStatusText = data.part2.isRunning ? 'Running' : 'Stopped';

    // NFT image
    const imageHTML = data.nftMetadata && data.nftMetadata.image
        ? `<img src="${data.nftMetadata.image}" class="mobile-nft-thumb" alt="${data.nftMetadata.name}" />`
        : `<div class="mobile-nft-placeholder-thumb">🎯</div>`;

    mobileHeroCard.innerHTML = `
        <div class="mobile-value-card">
            <div class="mobile-value-header">
                ${imageHTML}
                <div class="mobile-nft-info">
                    <div class="mobile-nft-title">${data.nftMetadata ? data.nftMetadata.name : 'Node #' + data.nftId}</div>
                    <div class="mobile-node-status ${nodeStatusClass}">${nodeStatusIcon} ${nodeStatusText}</div>
                </div>
            </div>

            <div class="mobile-total-value">
                <div class="mobile-total-label">💰 Total Remaining</div>
                <div class="mobile-total-amount">${formatNumber(formatEther(totalRemaining))} 0G</div>
                <div class="mobile-total-allocated">of ${formatNumber(formatEther(totalAllocated))} 0G allocated</div>
            </div>

            <a href="https://chainscan.0g.ai/nft/${CONFIG.NFT_CONTRACT_ADDRESS}/${data.nftId}"
               target="_blank" class="mobile-opensea-link">
                View on Explorer ↗
            </a>
        </div>
    `;
}

// Display Combined Vertical Timeline with Milestones
function displayCombinedTimeline(data) {
    const now = Math.floor(Date.now() / 1000);
    const tgeDate = data.milestones[0].timestamp;

    // Calculate which milestone we're currently in
    let currentMilestoneIndex = 0;
    for (let i = 0; i < data.milestones.length; i++) {
        if (now >= data.milestones[i].timestamp) {
            currentMilestoneIndex = i;
        }
    }

    // Calculate progress for vertical line
    const totalDuration = data.milestones[data.milestones.length - 1].timestamp - tgeDate;
    const elapsed = now - tgeDate;
    const progressPercent = Math.min((elapsed / totalDuration) * 100, 100);

    let itemsHTML = '';

    data.milestones.forEach((milestone, index) => {
        const nextMilestone = data.milestones[index + 1];
        const isPast = nextMilestone && now >= nextMilestone.timestamp;
        const isCurrent = now >= milestone.timestamp && (!nextMilestone || now < nextMilestone.timestamp);
        const isBest = milestone.penalty.eq(0);
        const penaltyPercent = (parseFloat(formatEther(milestone.penalty)) * 100).toFixed(0);

        // Calculate what they'll receive at this milestone
        const receiveAmount = calculatePenaltyAdjustedAmount(
            data.part1.remainingShare,
            milestone.penalty,
            data.part1.consumed,
            data.part1.penaltyFree
        );

        const receiveText = data.part1.remainingShare.eq(0)
            ? 'No claim left'
            : formatNumber(formatEther(receiveAmount)) + ' 0G';

        // Determine item classes
        let itemClasses = 'timeline-item';
        if (isPast) itemClasses += ' completed';
        if (isCurrent) itemClasses += ' current';
        if (isBest) itemClasses += ' best';

        // Badge
        let badge = '';
        if (isBest) {
            badge = '<span class="badge badge-best">BEST</span>';
        } else if (isCurrent) {
            badge = '<span class="badge badge-current">CURRENT</span>';
        } else if (!isPast) {
            badge = '<span class="badge badge-future">UPCOMING</span>';
        }

        itemsHTML += `
            <div class="${itemClasses}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div style="flex: 1; min-width: 160px;">
                        <div class="timeline-date-label">DATE</div>
                        <div class="timeline-date">${formatDate(milestone.timestamp)}</div>
                    </div>
                    <div class="timeline-penalty">
                        <div class="timeline-penalty-label">PENALTY</div>
                        <div class="timeline-penalty-value">${penaltyPercent}%</div>
                    </div>
                    <div class="timeline-amount">
                        <div class="timeline-amount-label">CLAIMABLE AMOUNT</div>
                        <div class="timeline-amount-value">${receiveText}</div>
                    </div>
                    <div class="timeline-badge">
                        ${badge}
                    </div>
                </div>
            </div>
        `;
    });

    const timelineSection = document.getElementById('timelineSection');
    timelineSection.innerHTML = `
        <div class="timeline">
            <div class="timeline-title">📅 Vesting Progress & Future Milestones</div>
            <div class="vertical-timeline">
                <div class="vertical-timeline-line"></div>
                <div class="vertical-timeline-progress" style="height: ${progressPercent}%"></div>
                ${itemsHTML}
            </div>
            <div class="note" style="margin-top: 1.5rem;">
                <strong>💡 Note:</strong> Claiming at 0% penalty (Sep 21, 2026) allows the NFT holder to receive the full remaining amount without any early withdrawal fees.
            </div>
        </div>
    `;
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

// Get penalty color class
function getPenaltyColorClass(penaltyPercent) {
    if (penaltyPercent === 0) return 'penalty-zero';
    if (penaltyPercent < 20) return 'penalty-verylow';
    if (penaltyPercent < 35) return 'penalty-low';
    if (penaltyPercent < 50) return 'penalty-medium';
    return 'penalty-high';
}

// Display Mobile Horizontal Timeline
// Display Mobile Milestones - Vertical cards showing all milestones
function displayMobileTimeline(data) {
    const mobileTimelineSection = document.getElementById('mobileTimelineSection');
    if (!mobileTimelineSection) return;

    const now = Math.floor(Date.now() / 1000);

    let milestonesHTML = '';

    data.milestones.forEach((milestone, index) => {
        const nextMilestone = data.milestones[index + 1];
        const isPast = nextMilestone && now >= nextMilestone.timestamp;
        const isCurrent = now >= milestone.timestamp && (!nextMilestone || now < nextMilestone.timestamp);
        const isBest = milestone.penalty.eq(0);

        const penaltyPercent = parseFloat(formatEther(milestone.penalty)) * 100;
        const penaltyColorClass = getPenaltyColorClass(penaltyPercent);

        // Calculate claimable amount with penalty
        const receiveAmount = calculatePenaltyAdjustedAmount(
            data.part1.remainingShare,
            milestone.penalty,
            data.part1.consumed,
            data.part1.penaltyFree
        );

        // Determine card class
        let cardClass = 'mobile-milestone-card';
        if (isPast) cardClass += ' past';
        if (isCurrent) cardClass += ' current';
        if (isBest) cardClass += ' best';

        // Badge
        let badgeHTML = '';
        let badgeClass = '';
        if (isBest) {
            badgeHTML = '✨ BEST';
            badgeClass = 'best';
        } else if (isCurrent) {
            badgeHTML = '📍 NOW';
            badgeClass = 'current';
        } else if (isPast) {
            badgeHTML = '✅ PAST';
            badgeClass = 'past';
        } else {
            badgeHTML = '🔒 FUTURE';
            badgeClass = 'upcoming';
        }

        // Days until/since
        const diffDays = Math.floor((milestone.timestamp - now) / (24 * 60 * 60));
        let daysText = '';
        if (isCurrent) {
            daysText = 'Available now';
        } else if (diffDays > 0) {
            daysText = `in ${diffDays} days`;
        } else if (!isPast) {
            daysText = 'upcoming';
        }

        // Penalty box styling
        let penaltyBoxClass = '';
        if (penaltyPercent === 0) {
            penaltyBoxClass = 'zero';
        } else if (penaltyPercent >= 35) {
            penaltyBoxClass = 'high';
        }

        milestonesHTML += `
            <div class="${cardClass}">
                <div class="mobile-milestone-header">
                    <div class="mobile-milestone-date-section">
                        <div class="mobile-milestone-date">${formatDate(milestone.timestamp)}</div>
                        ${daysText ? `<div class="mobile-milestone-days">${daysText}</div>` : ''}
                    </div>
                    <div class="mobile-milestone-badge ${badgeClass}">${badgeHTML}</div>
                </div>
                <div class="mobile-milestone-stats">
                    <div class="mobile-milestone-stat">
                        <div class="mobile-milestone-stat-label">Claimable</div>
                        <div class="mobile-milestone-stat-value">${formatNumber(formatEther(receiveAmount))} 0G</div>
                    </div>
                    <div class="mobile-milestone-penalty-box ${penaltyBoxClass}">
                        <div class="mobile-milestone-stat-label">Penalty</div>
                        <div class="mobile-milestone-stat-value ${penaltyColorClass}">${penaltyPercent.toFixed(0)}%</div>
                    </div>
                </div>
            </div>
        `;
    });

    mobileTimelineSection.innerHTML = `
        <div class="mobile-milestones-wrapper">
            ${milestonesHTML}
        </div>
    `;
}

// Display Mobile Part 2 Card - Compact vesting overview
function displayMobilePart2(data) {
    const mobilePart2Card = document.getElementById('mobilePart2Card');
    if (!mobilePart2Card) return;

    // Calculate Part 2 remaining
    const part2Remaining = data.part2.total.sub(data.part2.earned);

    // Calculate progress percentage
    const progressPercent = data.part2.total.gt(0)
        ? parseFloat(formatEther(data.part2.earned)) / parseFloat(formatEther(data.part2.total)) * 100
        : 0;

    // Node status
    const statusClass = data.part2.isRunning ? 'running' : 'stopped';
    const statusIcon = data.part2.isRunning ? '🟢' : '🔴';
    const statusText = data.part2.isRunning ? 'Running' : 'Not Running';

    // Last updated
    let lastUpdatedHTML = 'N/A';
    if (data.part2.lastUpdated) {
        const lastUpdateDate = new Date(data.part2.lastUpdated * 1000);
        const now = new Date();
        const diffDays = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            lastUpdatedHTML = 'Today';
        } else if (diffDays === 1) {
            lastUpdatedHTML = 'Yesterday';
        } else if (diffDays < 7) {
            lastUpdatedHTML = `${diffDays} days ago`;
        } else {
            lastUpdatedHTML = formatDate(data.part2.lastUpdated);
        }
    }

    // Warning if node not running
    let warningHTML = '';
    if (!data.part2.isRunning) {
        warningHTML = `
            <div class="mobile-part2-warning">
                <div class="mobile-part2-warning-icon">⚠️</div>
                <div>Node is not running. Rewards are not being earned. Activate your node to continue earning Part 2 vesting rewards.</div>
            </div>
        `;
    }

    mobilePart2Card.innerHTML = `
        <div class="mobile-part2-card">
            <div class="mobile-part2-header">
                <div class="mobile-part2-title">🚀 Part 2: Vesting</div>
                <div class="mobile-part2-status ${statusClass}">${statusIcon} ${statusText}</div>
            </div>

            <div class="mobile-part2-main">
                <div class="mobile-part2-label">💰 Remaining to Earn</div>
                <div class="mobile-part2-amount">${formatNumber(formatEther(part2Remaining))} 0G</div>
            </div>

            <div class="mobile-part2-progress">
                <div class="mobile-part2-progress-header">
                    <span class="mobile-part2-progress-label">Progress</span>
                    <span class="mobile-part2-progress-value">${progressPercent.toFixed(1)}%</span>
                </div>
                <div class="mobile-part2-progress-bar">
                    <div class="mobile-part2-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>

            <div class="mobile-part2-stats">
                <div class="mobile-part2-stat">
                    <div class="mobile-part2-stat-label">Earned</div>
                    <div class="mobile-part2-stat-value">${formatNumber(formatEther(data.part2.earned))} 0G</div>
                </div>
                <div class="mobile-part2-stat">
                    <div class="mobile-part2-stat-label">Total</div>
                    <div class="mobile-part2-stat-value">${formatNumber(formatEther(data.part2.total))} 0G</div>
                </div>
            </div>

            ${warningHTML}
        </div>
    `;
}

// Old function - no longer needed with vertical cards
function selectMobileMilestone(index) {
    if (!currentNFTData) return;

    const data = currentNFTData;
    const detailMilestone = data.milestones[index];
    const detailPenaltyPercent = (parseFloat(formatEther(detailMilestone.penalty)) * 100);
    const detailIsBest = detailMilestone.penalty.eq(0);

    const now = Math.floor(Date.now() / 1000);
    const nextMilestone = data.milestones[index + 1];
    const isPast = nextMilestone && now >= nextMilestone.timestamp;
    const isCurrent = now >= detailMilestone.timestamp && (!nextMilestone || now < nextMilestone.timestamp);

    const receiveAmount = calculatePenaltyAdjustedAmount(
        data.part1.remainingShare,
        detailMilestone.penalty,
        data.part1.consumed,
        data.part1.penaltyFree
    );

    const penaltyLoss = data.part1.remainingShare.sub(receiveAmount);

    let badgeHTML = '';
    let badgeClass = '';
    if (detailIsBest) {
        badgeHTML = '✨ ZERO PENALTY!';
        badgeClass = 'best';
    } else if (isCurrent) {
        badgeHTML = '📍 CURRENT';
        badgeClass = 'current';
    } else if (isPast) {
        badgeHTML = '✅ PASSED';
        badgeClass = 'current';
    } else {
        badgeHTML = '🔒 UPCOMING';
        badgeClass = 'upcoming';
    }

    const penaltyColorClass = getPenaltyColorClass(detailPenaltyPercent);

    let warningHTML = '';
    if (detailPenaltyPercent > 0 && isCurrent) {
        warningHTML = `
            <div class="mobile-milestone-warning">
                ⚠️ Claiming now loses <strong>${formatNumber(formatEther(penaltyLoss))} 0G</strong> to early withdrawal penalty
            </div>
        `;
    }

    const detailCard = document.getElementById('mobileMilestoneDetail');
    if (detailCard) {
        detailCard.innerHTML = `
            <div class="mobile-milestone-header">
                <div class="mobile-milestone-date">${formatDate(detailMilestone.timestamp)}</div>
                <div class="mobile-milestone-badge ${badgeClass}">${badgeHTML}</div>
            </div>
            <div class="mobile-milestone-stats">
                <div class="mobile-milestone-stat">
                    <div class="mobile-milestone-stat-label">Claimable</div>
                    <div class="mobile-milestone-stat-value">${formatNumber(formatEther(receiveAmount))} 0G</div>
                </div>
                <div class="mobile-milestone-stat">
                    <div class="mobile-milestone-stat-label">Penalty</div>
                    <div class="mobile-milestone-stat-value ${penaltyColorClass}">${detailPenaltyPercent.toFixed(0)}%</div>
                </div>
            </div>
            ${warningHTML}
        `;
    }
}

// Display Part 2 Grid
function displayPart2Grid(data) {
    const part2Grid = document.getElementById('part2Grid');

    // Calculate Part 2 remaining
    const part2Remaining = data.part2.total.sub(data.part2.earned);

    // Calculate progress percentage
    const progressPercent = data.part2.total.gt(0)
        ? parseFloat(formatEther(data.part2.earned)) / parseFloat(formatEther(data.part2.total)) * 100
        : 0;

    // Node status
    const statusHTML = data.part2.isRunning
        ? '<span style="color: #10B981;">🟢 Running</span>'
        : '<span style="color: #F59E0B;">🔴 Not Running</span>';

    // Last updated
    let lastUpdatedHTML = 'N/A';
    if (data.part2.lastUpdated) {
        const lastUpdateDate = new Date(data.part2.lastUpdated * 1000);
        const now = new Date();
        const diffDays = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            lastUpdatedHTML = 'Today';
        } else if (diffDays === 1) {
            lastUpdatedHTML = 'Yesterday';
        } else if (diffDays < 7) {
            lastUpdatedHTML = `${diffDays} days ago`;
        } else {
            lastUpdatedHTML = formatDate(data.part2.lastUpdated);
        }
    }

    part2Grid.innerHTML = `
        <div class="info-item" style="grid-column: 1 / -1; background: rgba(124, 58, 237, 0.1); border: 2px solid rgba(124, 58, 237, 0.3); padding: 2rem;">
            <div class="info-label" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">💰 Remaining to Earn</div>
            <div class="info-value" style="font-size: 2.5rem; color: #A855F7; margin: 0.75rem 0;">${formatNumber(formatEther(part2Remaining))} 0G</div>

            <!-- Progress Bar -->
            <div style="margin: 1.5rem 0 1rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                    <span style="color: rgba(255, 255, 255, 0.6);">Progress</span>
                    <span style="color: rgba(255, 255, 255, 0.8);">${progressPercent.toFixed(1)}%</span>
                </div>
                <div style="width: 100%; height: 12px; background: rgba(255, 255, 255, 0.1); border-radius: 9999px; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #10B981 0%, #059669 100%); border-radius: 9999px; transition: width 0.6s ease;"></div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-top: 0.75rem;">
                <span>Earned: <span style="color: #10B981; font-weight: 600;">${formatNumber(formatEther(data.part2.earned))} 0G</span></span>
                <span>Total: <span style="color: rgba(255, 255, 255, 0.8); font-weight: 600;">${formatNumber(formatEther(data.part2.total))} 0G</span></span>
            </div>
        </div>

        <div class="info-item">
            <div class="info-label">Node Status</div>
            <div class="info-value">${statusHTML}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Last Updated</div>
            <div class="info-value">${lastUpdatedHTML}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Vesting Period</div>
            <div class="info-value">36 Months</div>
        </div>
        <div class="info-item">
            <div class="info-label">Requirements</div>
            <div class="info-value">Active Node</div>
        </div>
    `;
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
window.switchTab = switchTab;
