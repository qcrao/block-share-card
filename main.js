// 确保在文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  const iconHTML = `<span class="bp3-icon bp3-icon-share"></span>`;
  const button = document.createElement('span');
  button.className = 'bp3-button bp3-minimal bp3-small';
  button.innerHTML = iconHTML + ' Share';
  button.onclick = () => toggleDropdown();

  const dropdownHTML = `
      <ul class="dropdown-menu">
          <li onclick="logShare('mobile')">Mobile</li>
          <li onclick="logShare('pc')">PC</li>
      </ul>
  `;
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown';
  dropdown.style.display = 'none';
  dropdown.innerHTML = dropdownHTML;

  const topbar = document.querySelector('.rm-topbar > div');
  topbar.insertBefore(button, topbar.firstChild);
  topbar.insertBefore(dropdown, button.nextSibling);

  function toggleDropdown() {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }

  window.logShare = (type) => {
      console.log(`Share to ${type}`);
      dropdown.style.display = 'none';
  };
});