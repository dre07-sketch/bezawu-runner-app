
async function verify() {
    try {
        const id = 'BZWB-388637'; // 6 kilo
        console.log(`Fetching products for ${id}...`);
        const res = await fetch(`http://localhost:5000/api/products?branch_id=${id}`);
        const data = await res.json();
        console.log(`Got ${data.length} products.`);
        data.forEach(p => console.log(`- ${p.name}`));
    } catch (e) {
        console.error(e);
    }
}
verify();
