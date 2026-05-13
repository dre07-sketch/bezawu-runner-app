// Native fetch used

async function verify() {
    try {
        // 1. Get two branches
        const branchesRes = await fetch('http://localhost:5000/api/supermarkets/nearby?lat=9.0&lng=38.7'); // accurate enough to get some
        const branches = await branchesRes.json();

        if (branches.length < 2) {
            console.log("Not enough branches to compare.");
            return;
        }

        const branch1 = branches[0];
        const branch2 = branches[1];

        console.log(`Comparing Branch 1: ${branch1.branch_name} (ID: ${branch1.id})`);
        console.log(`Comparing Branch 2: ${branch2.branch_name} (ID: ${branch2.id})`);

        // 2. Fetch products for Branch 1
        const p1Res = await fetch(`http://localhost:5000/api/products?branch_id=${branch1.id}`);
        const p1 = await p1Res.json();

        // 3. Fetch products for Branch 2
        const p2Res = await fetch(`http://localhost:5000/api/products?branch_id=${branch2.id}`);
        const p2 = await p2Res.json();

        console.log(`Branch 1 Product Count: ${p1.length}`);
        console.log(`Branch 2 Product Count: ${p2.length}`);

        if (p1.length !== p2.length) {
            console.log("SUCCESS: Product counts differ!");
        } else {
            // Check contents if counts match (unlikely with random 50%)
            const p1Ids = p1.map(p => p.id).sort().join(',');
            const p2Ids = p2.map(p => p.id).sort().join(',');

            if (p1Ids !== p2Ids) {
                console.log("SUCCESS: Product content differs!");
            } else {
                console.log("WARNING: Product content is identical (could happen by chance, run differentiate again if needed).");
            }
        }

    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

verify();
