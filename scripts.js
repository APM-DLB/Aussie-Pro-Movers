// Google Analytics
(function() {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXX');
})();

// Structured Data
const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Aussie Move Pros",
    "image": "URL_TO_YOUR_LOGO",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Canberra",
        "addressRegion": "ACT",
        "addressCountry": "Australia"
    },
    "telephone": "+61478762114",
    "url": "https://www.aussiemovepros.com.au",
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
        }
    ],
    "sameAs": [
        "YOUR_FACEBOOK_URL",
        "YOUR_X_URL"
    ]
};

// Add structured data to the page
document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // --- INSTANT QUOTE LOGIC ---
    const quoteForm = document.getElementById('quote-form');
    if (!quoteForm) return; // Only run on instant-quote.html

    const moveTypeField = document.getElementById('move-type');
    const suburbDropdown = document.getElementById('suburb');
    const quoteResult = document.getElementById('quote-result');
    const distanceField = document.querySelector('.form-group-distance');

    // Enhanced pricing structure
    const pricing = {
        local: {
            baseRate: 170,
            hourlyRates: {
                '2': 130,
                '3': 150,
                '4': 170,
                '5': 190,
                '5+': 210
            },
            minimumHours: {
                '2': 3,
                '3': 4,
                '4': 5,
                '5': 6,
                '5+': 7
            },
            truckSizes: {
                '6t': { basePrice: 100, hourlyRate: 20 },
                '9t': { basePrice: 150, hourlyRate: 30 }
            }
        },
        interstate: {
            baseRate: 3000,
            distanceRate: 2.5,
            minDistance: 100,
            truckSizes: {
                '6t': { basePrice: 500, kmRate: 3 },
                '9t': { basePrice: 750, kmRate: 4 }
            }
        }
    };

    // Suburb distance data (approximate distances from Canberra in km)
    const suburbDistances = {
        'Sydney': 290,
        'Melbourne': 660,
        'Brisbane': 1200,
        'Adelaide': 1160,
        'Perth': 3730,
        'Hobart': 1160,
        'Darwin': 3970,
        'Gold Coast': 1170,
        'Newcastle': 440,
        'Wollongong': 240,
        'Geelong': 700,
        'Townsville': 2000,
        'Cairns': 2400,
        'Toowoomba': 1160,
        'Albury': 340,
        'Wagga Wagga': 240,
        'Bendigo': 620,
        'Ballarat': 650,
        'Launceston': 960,
        'Mackay': 1850
    };

    function populateSuburbs(moveType) {
        suburbDropdown.innerHTML = '<option value="">Select Suburb</option>';
        
        if (moveType === 'local') {
            const localSuburbs = [
                'Belconnen', 'Tuggeranong', 'Woden', 'Gungahlin', 'Inner North', 'Inner South',
                'Weston Creek', 'Molonglo Valley', 'Queanbeyan', 'Hall', 'Oaks Estate'
            ];
            
            localSuburbs.sort().forEach(suburb => {
                const option = document.createElement('option');
                option.value = suburb;
                option.textContent = suburb;
                suburbDropdown.appendChild(option);
            });
        } else if (moveType === 'interstate') {
            const cities = Object.keys(suburbDistances);
            cities.sort().forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = `${city} (${suburbDistances[city]}km)`;
                suburbDropdown.appendChild(option);
            });
        }
    }

    moveTypeField.addEventListener('change', function() {
        const isInterstate = this.value === 'interstate';
        distanceField.style.display = isInterstate ? 'block' : 'none';
        populateSuburbs(this.value);
        
        // Reset suburb selection when move type changes
        suburbDropdown.value = '';
        
        // Auto-fill distance for interstate moves
        if (isInterstate) {
            const distanceInput = document.getElementById('distance');
            suburbDropdown.addEventListener('change', function() {
                const selectedSuburb = this.value;
                if (suburbDistances[selectedSuburb]) {
                    distanceInput.value = suburbDistances[selectedSuburb];
                }
            });
        }
    });

    function calculateQuote(formData) {
        const moveType = formData.get('move-type');
        const suburb = formData.get('suburb');
        const distance = parseFloat(formData.get('distance')) || 0;
        const truckSize = formData.get('truck-size');
        const movers = formData.get('movers');

        let totalCost = 0;
        let breakdown = {
            baseRate: 0,
            laborCost: 0,
            distanceFee: 0,
            equipmentFee: 0,
            truckFee: 0
        };

        if (moveType === 'local') {
            // Local move calculation
            breakdown.baseRate = pricing.local.baseRate;
            breakdown.laborCost = pricing.local.hourlyRates[movers] * pricing.local.minimumHours[movers];
            breakdown.equipmentFee = pricing.local.truckSizes[truckSize].basePrice;
            breakdown.truckFee = pricing.local.truckSizes[truckSize].hourlyRate * pricing.local.minimumHours[movers];
        } else {
            // Interstate move calculation
            breakdown.baseRate = pricing.interstate.baseRate;
            breakdown.distanceFee = Math.max(distance, pricing.interstate.minDistance) * pricing.interstate.distanceRate;
            breakdown.equipmentFee = pricing.interstate.truckSizes[truckSize].basePrice;
            breakdown.truckFee = distance * pricing.interstate.truckSizes[truckSize].kmRate;
            breakdown.laborCost = parseInt(movers) * 150 * Math.ceil(distance/400); // Day rate for long distance
        }

        totalCost = Object.values(breakdown).reduce((a, b) => a + b, 0);

        return {
            total: totalCost,
            breakdown: breakdown
        };
    }

    function animateNumber(element, final, duration = 1000) {
        const start = 0;
        const increment = final > start ? 1 : -1;
        const steps = 50;
        const stepValue = Math.abs(final - start) / steps;
        let current = start;
        
        const timer = setInterval(() => {
            current += stepValue * increment;
            if ((increment === 1 && current >= final) || 
                (increment === -1 && current <= final)) {
                clearInterval(timer);
                element.textContent = final.toLocaleString('en-AU', {
                    style: 'currency',
                    currency: 'AUD'
                });
            } else {
                element.textContent = Math.round(current).toLocaleString('en-AU', {
                    style: 'currency',
                    currency: 'AUD'
                });
            }
        }, duration / steps);
    }

    quoteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const quote = calculateQuote(formData);
        
        // Simply show the quote result with animation
        const quoteResult = document.getElementById('quote-result');
        quoteResult.classList.add('visible');
        
        // Animate the truck
        const truckAnimation = document.getElementById('truck-animation');
        truckAnimation.classList.remove('animate-truck');
        void truckAnimation.offsetWidth; // Trigger reflow
        truckAnimation.classList.add('animate-truck');
        
        // Update quote amount with animation
        const quoteAmount = document.getElementById('quote-amount');
        animateNumber(quoteAmount, quote.total);
        
        // Update breakdown details
        document.getElementById('base-rate').textContent = quote.breakdown.baseRate.toLocaleString('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });
        document.getElementById('distance-fee').textContent = quote.breakdown.distanceFee.toLocaleString('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });
        document.getElementById('labor-cost').textContent = quote.breakdown.laborCost.toLocaleString('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });
        document.getElementById('equipment-fee').textContent = (quote.breakdown.equipmentFee + quote.breakdown.truckFee).toLocaleString('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });
    });

    // Initial population of suburbs
    populateSuburbs('local');
});