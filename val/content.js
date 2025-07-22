// Content script for www.vlr.gg
(function() {
  console.log("VLR.gg extension content script loaded!");
  // Dynamically load the Nhost SDK
  // Check if we are NOT on the main page (no path or only "/")
  if (window.location.pathname !== '/' && window.location.pathname !== '') {
    // Create the popup div
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.bottom = '24px';
    popup.style.right = '24px';
    popup.style.background = '#1e1e1e';
    popup.style.border = '1px solid #444';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.8)';
    popup.style.padding = '16px 24px';
    popup.style.zIndex = '9999';
    popup.style.fontFamily = 'sans-serif';
    popup.style.fontSize = '16px';
    popup.style.color = '#f5f5f5';
    popup.style.minWidth = '320px';
    popup.style.minHeight = '60px';
    popup.style.boxSizing = 'border-box';
    popup.style.position = 'fixed';
    popup.style.overflow = 'visible';
    // Add a close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '12px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '22px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#f5f5f5';
    closeBtn.style.padding = '0';
    closeBtn.onclick = () => popup.remove();
    // --- Extract player names and URLs ---
    const playerNodes = document.querySelectorAll('td.mod-player .text-of');
    const seen = new Set();
    const players = [];
    Array.from(playerNodes).forEach(node => {
      let url = null;
      let el = node;
      while (el && el !== document.body) {
        if (el.tagName === 'A' && el.href) {
          url = el.href;
          break;
        }
        el = el.parentElement;
      }
      const name = node.textContent.trim();
      const key = name + '|' + url;
      if (!seen.has(key)) {
        seen.add(key);
        players.push({ name, url });
      }
    });
    // Create a list of players
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    // Add loading indicator (spinner)
    // const loading = document.createElement('div');
    // loading.style.display = 'flex';
    // loading.style.justifyContent = 'center';
    // loading.style.alignItems = 'center';
    // loading.style.height = '40px';
    // loading.style.margin = '8px 0';
    // loading.innerHTML = `
    //   <div style="
    //     border: 4px solid #444;
    //     border-top: 4px solid #ffd700;
    //     border-radius: 50%;
    //     width: 28px;
    //     height: 28px;
    //     animation: vlr-spin 1s linear infinite;
    //   "></div>
    //   <style>
    //     @keyframes vlr-spin {
    //       0% { transform: rotate(0deg); }
    //       100% { transform: rotate(360deg); }
    //     }
    //   </style>
    // `;
    // popup.appendChild(loading);
    // Add title and close button
    const title = document.createElement('div');
    title.textContent = 'Players in this match:';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.color = '#f5f5f5';
    popup.appendChild(title);
    popup.appendChild(closeBtn);
    // Add loading indicator (spinner) below the title
    const loading = document.createElement('div');
    loading.style.display = 'flex';
    loading.style.justifyContent = 'center';
    loading.style.alignItems = 'center';
    loading.style.height = '40px';
    loading.style.margin = '8px 0';
    loading.innerHTML = `
      <div style="
        border: 4px solid #444;
        border-top: 4px solid #fff;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        animation: vlr-spin 1s linear infinite;
      "></div>
      <style>
        @keyframes vlr-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    popup.appendChild(loading);
    // Don't append the list yet
    // popup.appendChild(list);
    // Add to the page
    document.body.appendChild(popup);

    // For each player, fetch their top agent info
    async function getTopAgentInfo(playerUrl) {
      try {
        const res = await fetch(playerUrl);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Find the first agent row in the AGENTS table
        const agentRow = doc.querySelector('.wf-table tbody tr');
        if (!agentRow) return null;
        const img = agentRow.querySelector('img');
        // Get ACS value (5th column: td:nth-child(5))
        const acsCell = agentRow.querySelector('td:nth-child(5)');
      return {
          agentImg: img ? (img.src.startsWith('http') ? img.src : 'https://www.vlr.gg' + img.getAttribute('src')) : null,
          acs: acsCell ? acsCell.textContent.trim() : null
        };
      } catch (e) {
        return null;
      }
    }

    // Fetch all agent info in parallel, then render the list
    (async () => {
      // Prepare URLs for all players
      const statsUrls = players.map(player => {
        if (player.url) {
          let statsUrl = player.url;
          if (!statsUrl.includes('?timespan=90d')) {
            statsUrl = statsUrl.split('?')[0] + '?timespan=90d';
          }
          return statsUrl;
        }
        return null;
    });
      // Fetch all agent info in parallel
      const agentInfos = await Promise.all(statsUrls.map(url => url ? getTopAgentInfo(url) : Promise.resolve(null)));
      // Now render the list
      list.innerHTML = '';
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const agentInfo = agentInfos[i];
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.marginBottom = '8px';
        // Color first 5 players red
        const isTop5 = i < 5;
        if (player.url) {
          const a = document.createElement('a');
          a.href = player.url;
          a.textContent = player.name;
          a.target = '_blank';
          a.style.color = isTop5 ? '#ff3b3b' : '#4ea1ff';
          a.style.textDecoration = 'none';
          a.style.fontWeight = 'bold';
          a.style.fontSize = '17px';
          a.onmouseover = () => a.style.textDecoration = 'underline';
          a.onmouseout = () => a.style.textDecoration = 'none';
          li.appendChild(a);
        } else {
          li.textContent = player.name;
          li.style.fontWeight = 'bold';
          li.style.fontSize = '17px';
          if (isTop5) li.style.color = '#ff3b3b';
        }
        if (agentInfo && agentInfo.agentImg) {
          const img = document.createElement('img');
          img.src = agentInfo.agentImg;
          img.alt = 'agent';
          img.style.width = '20px';
          img.style.height = '20px';
          img.style.verticalAlign = 'middle';
          img.style.marginRight = '6px';
          li.insertBefore(img, li.firstChild);
        }
        if (agentInfo && agentInfo.acs) {
          const acsSpan = document.createElement('span');
          acsSpan.textContent = agentInfo.acs;
          acsSpan.style.color = isTop5 ? '#ff3b3b' : '#ffd700';
          acsSpan.style.fontSize = '16px';
          acsSpan.style.fontWeight = 'bold';
          acsSpan.style.marginLeft = '10px';
          li.appendChild(acsSpan);
        }
        list.appendChild(li);
      }
      loading.remove();
      popup.appendChild(list);
    })();

    // Example: send to backend API
    fetch('http://localhost:3000/api/players', { // or your deployed URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Players saved to MongoDB:', data);
    })
    .catch(err => {
      console.error('Error saving players:', err);
    });
  }
})(); 