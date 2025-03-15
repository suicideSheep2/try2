 document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const galleryContainer = document.getElementById('gallery');
  const statusMessage = document.getElementById('statusMessage');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const imageInfo = document.getElementById('imageInfo');
  const closeBtn = document.getElementById('closeModal');
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  const breadcrumb = document.getElementById('breadcrumb');
  const currentPathDisplay = document.getElementById('currentPath');

  // Gallery state
  const state = {
  repositories: [
  { username: 'suicideSheep2', repo: 'try2', rootPath: 'photos' },
  // Add more repositories here
  // { username: 'user2', repo: 'repo2', rootPath: 'images' }
  ],
  allFiles: [], // Store all files from all repos
  currentPath: '',
  currentImages: [],
  currentFolders: [],
  currentIndex: 0,
  viewMode: 'grid',
  filterMode: 'all',
  };

  // Initialize view buttons
  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach(btn => {
  btn.addEventListener('click', function() {
  viewButtons.forEach(b => b.classList.remove('active'));
  this.classList.add('active');

  state.viewMode = this.dataset.size;
  updateGalleryView();
  });
  });

  // Initialize filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
  btn.addEventListener('click', function() {
  filterButtons.forEach(b => b.classList.remove('active'));
  this.classList.add('active');

  state.filterMode = this.dataset.filter;
  updateGalleryView();
  });
  });

  // Function to fetch GitHub directory contents
  async function fetchGitHubDirectory(username, repo, path) {
  try {
  statusMessage.textContent = 'Loading content...';
  statusMessage.style.display = 'block';

  const response = await fetch(
  `https://api.github.com/repos/${username}/${repo}/contents/${path}`
  );

  if (!response.ok) {
  throw new Error(`Failed to fetch: ${response.status}`);
  }

  const data = await response.json();
  return data;
  } catch (error) {
  console.error('Error fetching GitHub directory:', error);
  statusMessage.textContent =
  'Error loading content. Please check your connection.';
  return null;
  }
  }

  // Function to update breadcrumb navigation
  function updateBreadcrumb(path) {
  breadcrumb.innerHTML = '';

  // Add home item
  const homeItem = document.createElement('div');
  homeItem.className = 'breadcrumb-item';
  homeItem.textContent = 'Home';
  homeItem.dataset.path = '';
  homeItem.addEventListener('click', () => navigateToFolder(''));
  breadcrumb.appendChild(homeItem);

  // If we're not in the root folder, add path segments
  if (path !== '') {
  const segments = path.split('/');
  let currentSegmentPath = '';

  for (let i = 0; i < segments.length; i++) {
  currentSegmentPath += (currentSegmentPath ? '/' : '') + segments[i];

  const item = document.createElement('div');
  item.className =
  i === segments.length - 1
  ? 'breadcrumb-item active'
  : 'breadcrumb-item';
  item.textContent = segments[i];

  if (i < segments.length - 1) {
  item.dataset.path = currentSegmentPath;
  item.addEventListener('click', () => navigateToFolder(item.dataset.path));
  }

  breadcrumb.appendChild(item);
  }
  }
  }

  // Function to navigate to a folder
  function navigateToFolder(path) {
  state.currentPath = path;
  currentPathDisplay.textContent = path;
  galleryContainer.innerHTML = '';
  updateBreadcrumb(path);
  loadGalleryContent();
  }

  // Function to update gallery view based on current filters and view mode
  function updateGalleryView() {
  // Apply view mode
  if (state.viewMode === 'large') {
  galleryContainer.classList.add('large-view');
  } else {
  galleryContainer.classList.remove('large-view');
  }

  // Apply filters
  const items = galleryContainer.querySelectorAll('.gallery-item');
  items.forEach(item => {
  if (state.filterMode === 'all') {
  item.style.display = 'flex';
  } else if (state.filterMode === 'folders') {
  item.style.display = item.classList.contains('folder-item')
  ? 'flex'
  : 'none';
  } else if (state.filterMode === 'images') {
  item.style.display = !item.classList.contains('folder-item')
  ? 'flex'
  : 'none';
  }
  });

  // Show status message if no items visible
  const visibleItems = Array.from(items).filter(
  item => item.style.display !== 'none'
  );
  if (visibleItems.length === 0) {
  statusMessage.textContent = `No ${state.filterMode} found in this directory.`;
  statusMessage.style.display = 'block';
  } else {
  statusMessage.style.display = 'none';
  }
  }

  // Function to load and display gallery content
  async function loadGalleryContent() {
  galleryContainer.classList.add('loading');
  state.allFiles = []; // Reset allFiles

  // Fetch files from all repositories
  for (const repo of state.repositories) {
  const fullPath = repo.rootPath
  ? `${repo.rootPath}/${state.currentPath}`
  : state.currentPath;
  const files = await fetchGitHubDirectory(
  repo.username,
  repo.repo,
  fullPath
  );

  if (files) {
  state.allFiles = state.allFiles.concat(files);
  }
  }

  if (state.allFiles.length === 0) {
  statusMessage.textContent = 'No content found in these directories.';
  galleryContainer.classList.remove('loading');
  return;
  }

  galleryContainer.innerHTML = '';

  // Sort files and folders
  const folders = state.allFiles.filter(file => file.type === 'dir');
  const imageFiles = state.allFiles.filter(file => {
  if (file.type !== 'file') return false;
  const ext = file.name.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  });

  // Store current content for filtering and modal navigation
  state.currentFolders = folders;
  state.currentImages = imageFiles;

  // Add folders first
  folders.forEach(folder => {
  const folderItem = document.createElement('div');
  folderItem.className = 'gallery-item folder-item';
  folderItem.innerHTML = `
  <div class="folder-icon">📁</div>
  <div class="folder-name">${folder.name}</div>
  `;
  folderItem.addEventListener('click', () =>
  navigateToFolder(
  state.currentPath ? `${state.currentPath}/${folder.name}` : folder.name
  )
  );
  galleryContainer.appendChild(folderItem);
  });

  // Then add images
  imageFiles.forEach((file, index) => {
  const imageUrl = file.download_url;

  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-item';

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = file.name;
  img.loading = 'lazy';

  const caption = document.createElement('div');
  caption.className = 'image-caption';
  caption.textContent = file.name;

  // Add click event to open modal
  img.onclick = function() {
  openModal(index);
  };

  galleryItem.appendChild(img);
  galleryItem.appendChild(caption);
  galleryContainer.appendChild(galleryItem);
  });

  // Check if there's content to display
  if (folders.length === 0 && imageFiles.length === 0) {
  statusMessage.textContent =
  'No images or folders found in these directories.';
  statusMessage.style.display = 'block';
  } else {
  statusMessage.style.display = 'none';

  // Apply current filters
  updateGalleryView();
  }

  galleryContainer.classList.remove('loading');
  }

  // Function to open image in lightbox
  function openModal(index) {
  if (state.currentImages.length === 0) return;

  state.currentIndex = index;
  const imageFile = state.currentImages[state.currentIndex];

  modal.style.display = 'block';
  modalImg.src = imageFile.download_url;
  modalImg.alt = imageFile.name;

  imageInfo.textContent = `${imageFile.name} • ${state.currentIndex +
  1} of ${state.currentImages.length}`;

  document.body.style.overflow = 'hidden';

  // Update navigation buttons state
  updateNavigationButtons();
  }

  // Function to update navigation buttons state
  function updateNavigationButtons() {
  prevButton.style.visibility = state.currentIndex > 0 ? 'visible' : 'hidden';
  nextButton.style.visibility =
  state.currentIndex < state.currentImages.length - 1
  ? 'visible'
  : 'hidden';
  }

  // Function to navigate to previous image
  function navigateToPrevImage() {
  if (state.currentIndex > 0) {
  state.currentIndex--;
  updateModalImage();
  }
  }

  // Function to navigate to next image
  function navigateToNextImage() {
  if (state.currentIndex < state.currentImages.length - 1) {
  state.currentIndex++;
  updateModalImage();
  }
  }

  // Function to update the modal image
  function updateModalImage() {
  const imageFile = state.currentImages[state.currentIndex];
  modalImg.src = imageFile.download_url;
  modalImg.alt = imageFile.name;

  imageInfo.textContent = `${imageFile.name} • ${state.currentIndex +
  1} of ${state.currentImages.length}`;

  updateNavigationButtons();
  }

  // Function to close the modal
  function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  }

  // Event Listeners

  // Close lightbox
  closeBtn.addEventListener('click', closeModal);

  // Close lightbox when clicking outside the image
  modal.addEventListener('click', function(event) {
  if (event.target === modal) {
  closeModal();
  }
  });

  // Navigation buttons
  prevButton.addEventListener('click', navigateToPrevImage);
  nextButton.addEventListener('click', navigateToNextImage);

  // Keyboard navigation
  document.addEventListener('keydown', function(event) {
  if (modal.style.display === 'block') {
  if (event.key === 'ArrowLeft') {
  navigateToPrevImage();
  } else if (event.key === 'ArrowRight') {
  navigateToNextImage();
  } else if (event.key === 'Escape') {
  closeModal();
  }
  }
  });

  // Initialization: Load content from the first repository's root path
  state.currentPath = ''; // Initialize to an empty path (root)
  loadGalleryContent();
 });
