// Function to create the share icon and dropdown menu
function createShareIcon() {
    // Create the icon element
    const shareIcon = document.createElement('div');
    shareIcon.id = 'share-icon';
    shareIcon.innerHTML = '🔗';
    shareIcon.style.cursor = 'pointer';
    shareIcon.style.margin = '0 10px';
  
    // Create the dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.id = 'share-dropdown';
    dropdownMenu.style.display = 'none';
    dropdownMenu.style.position = 'absolute';
    dropdownMenu.style.backgroundColor = '#fff';
    dropdownMenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    dropdownMenu.style.padding = '10px';
    dropdownMenu.style.borderRadius = '4px';
    dropdownMenu.style.zIndex = '1000';
  
    // Create menu items
    const mobileItem = document.createElement('div');
    mobileItem.innerText = 'Mobile';
    mobileItem.style.padding = '5px 10px';
    mobileItem.style.cursor = 'pointer';
    mobileItem.onclick = () => {
      shareBlockAsCard('mobile');
    };
  
    const pcItem = document.createElement('div');
    pcItem.innerText = 'PC';
    pcItem.style.padding = '5px 10px';
    pcItem.style.cursor = 'pointer';
    pcItem.onclick = () => {
      shareBlockAsCard('pc');
    };
  
    dropdownMenu.appendChild(mobileItem);
    dropdownMenu.appendChild(pcItem);
  
    // Add event listeners to the icon
    shareIcon.onclick = (event) => {
      const isDropdownVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isDropdownVisible ? 'none' : 'block';
      dropdownMenu.style.top = `${event.clientY + 10}px`;
      dropdownMenu.style.left = `${event.clientX - 10}px`;
    };
  
    // Close the dropdown if clicked outside
    document.addEventListener('click', (event) => {
      if (!shareIcon.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
  
    // Add the icon and menu to the top bar
    const topBar = document.querySelector('.rm-topbar');
    if (topBar) {
      topBar.appendChild(shareIcon);
      document.body.appendChild(dropdownMenu);
    }
  }
  
  // Function to share a Roam block as a card
  function shareBlockAsCard(device) {
    // Get the currently focused block's content
    const block = document.activeElement.closest('.roam-block');
    if (block) {
      const blockContent = block.innerText;
      const cardWidth = device === 'mobile' ? '300px' : '600px';
      const card = `
        <div style="width: ${cardWidth}; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
          ${blockContent}
        </div>
      `;
      console.log(`Sharing block as a ${device} card:`);
      console.log(card);
    } else {
      console.log('No block selected');
    }
  }
  
  // Initialize the plugin
  function initPlugin() {
    createShareIcon();
  }
  
  // Load the plugin
  document.addEventListener('DOMContentLoaded', initPlugin);