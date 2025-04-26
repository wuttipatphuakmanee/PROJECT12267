document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selection ---
    const movieCards = document.querySelectorAll('.movie-card');
    const currentPoster = document.getElementById('current-poster');
    const currentMovieTitle = document.getElementById('current-movie-title');
    const branchSelect = document.getElementById('branch');
    const dateInput = document.getElementById('show-date');
    const timeButtonsContainer = document.querySelector('.showtimes');
    const seatingSection = document.getElementById('seating-section');
    const summarySection = document.getElementById('summary-section');
    const seatsContainer = document.querySelector('.seats');
    const summaryMovieSpan = document.getElementById('summary-movie');
    const summaryBranchSpan = document.getElementById('summary-branch');
    const summaryDateSpan = document.getElementById('summary-date');
    const summaryTimeSpan = document.getElementById('summary-time');
    const selectedSeatsSpan = document.getElementById('summary-seats');
    const seatCountSpan = document.getElementById('summary-count');
    const totalPriceSpan = document.getElementById('summary-price'); // Overall total price
    const confirmBtn = document.getElementById('confirm-btn');
    const countdownTimerSpan = document.getElementById('timer');
    const loadingOverlay = document.getElementById('loading-overlay');
    const modal = document.getElementById('confirmation-modal'); // Confirmation modal
    const closeModalButtons = modal?.querySelectorAll('.close-button'); // Includes footer button
    const modalSummaryDiv = document.getElementById('modal-summary');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const currentYearSpan = document.getElementById('current-year');

    // Trailer Modal Elements
    const trailerButtons = document.querySelectorAll('.btn-trailer');
    const trailerModal = document.getElementById('trailer-modal');
    const trailerModalCloseBtn = trailerModal?.querySelector('.trailer-close-button');
    const youtubePlayerContainer = document.getElementById('youtube-player-container');

    // F&B Elements
    const fbSection = document.getElementById('fb-section');
    const fbItemsGrid = document.querySelector('.fb-items-grid');
    const fbSubtotalPriceSpan = document.getElementById('fb-subtotal-price');
    const summaryFbItemsSpan = document.getElementById('summary-fb-items');
    const summaryFbPriceSpan = document.getElementById('summary-fb-price');

    // --- NEW: Navigation and Section Elements ---
    const navLinkMovies = document.getElementById('nav-link-movies');
    const navLinkBranches = document.getElementById('nav-link-branches');
    const navLinkPromotions = document.getElementById('nav-link-promotions');
    const allNavLinks = document.querySelectorAll('header nav .nav-link:not(.login-link)'); // Select non-login nav links

    const bookingFlowSection = document.getElementById('booking-flow-section');
    const branchInfoSection = document.getElementById('branch-info-section');
    const promotionSection = document.getElementById('promotion-section');
    const allMainSections = [bookingFlowSection, branchInfoSection, promotionSection]; // Array of main switchable sections

    const progressSection = document.querySelector('.progress-section'); // Select progress bar section

    // --- NEW: Login Modal Elements ---
    const loginButton = document.getElementById('nav-link-login');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModalButtons = loginModal?.querySelectorAll('.close-login-modal'); // ปุ่มปิด X ใน Login Modal
    const loginForm = document.getElementById('login-form');

    // --- State Variables ---
    let selectedMovie = { // Initial default selection based on 'active' card
        id: document.querySelector('.movie-card.active')?.dataset.movieId || 'lahnmah',
        title: document.querySelector('.movie-card.active')?.dataset.movieTitle || 'หลานม่า',
        poster: document.querySelector('.movie-card.active')?.querySelector('img')?.src || 'https://img2.pic.in.th/pic/thumb_3972.jpg'
    };
    let selectedBranch = branchSelect?.value;
    let selectedDate = dateInput?.value;
    let selectedTime = null;
    let selectedSeats = []; // Array of objects: { id: 'A1', price: 250 }
    let selectedFbItems = {}; // Object for F&B: { 'itemId': { quantity: N, price: P, name: '...' } }
    let countdownInterval = null;
    let timerSeconds = 600; // 10 minutes
    const FADE_DURATION = 300; // Match CSS transition speed in ms

    // --- Initial Setup ---
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) {
        dateInput.value = today;
        selectedDate = today;
        dateInput.min = today;
    } else {
        selectedDate = today; // Fallback
    }

    updateSelectedMovieDetails(selectedMovie);
    updateSummaryDisplay();
    showSection('booking-flow-section', true); // Show booking flow by default (isMajorChange = true for initial load)

    // --- Event Listeners ---

    // Movie Selection
    movieCards.forEach(card => {
        card.addEventListener('click', () => {
            // *** เรียก showSection โดยตั้ง isMajorChange = false เพื่อไม่ให้ scroll top ***
            showSection('booking-flow-section', false);

            // Then, proceed with movie selection logic
            movieCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedMovie = {
                id: card.dataset.movieId,
                title: card.dataset.movieTitle,
                poster: card.querySelector('img').src
            };
            updateSelectedMovieDetails(selectedMovie);
            resetAllSelections();
            hideSeatAndSummary(() => {
                updateProgressSteps(1);
                // Scroll to booking details after selection
                const bookingDetailsElement = document.querySelector('.booking-details');
                 if(bookingDetailsElement) {
                     bookingDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }
            });
        });
    });

    // Branch Selection
    if (branchSelect) {
        branchSelect.addEventListener('change', (event) => {
            selectedBranch = event.target.value;
            updateSummaryDisplay();
        });
    }

    // Date Selection
    if (dateInput) {
        dateInput.addEventListener('change', (event) => {
            selectedDate = event.target.value;
            resetTimeSelection();
            hideSeatAndSummary(() => {
                updateProgressSteps(1);
            });
        });
    }

    // Time Selection
    if (timeButtonsContainer) {
        timeButtonsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('time-btn')) {
                const currentSelected = timeButtonsContainer.querySelector('.selected-time');
                if (currentSelected) {
                    currentSelected.classList.remove('selected-time');
                }
                event.target.classList.add('selected-time');
                selectedTime = event.target.dataset.time;
                seatsContainer?.querySelectorAll('.seat.selected').forEach(seat => seat.classList.remove('selected'));
                selectedSeats = [];
                updateSummaryDisplay();
                showLoading();
                setTimeout(() => {
                    hideLoading();
                    showSeatAndSummary();
                    updateProgressSteps(2);
                    if(seatingSection) {
                        seatingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 800);
            }
        });
    }

    // Seat Selection
    if (seatsContainer) {
        seatsContainer.addEventListener('click', (event) => {
            const seatElement = event.target.closest('.seat');
            if (seatElement && !seatElement.classList.contains('occupied')) {
                const seatId = seatElement.dataset.seat;
                const seatPrice = parseInt(seatElement.dataset.price) || 0;
                seatElement.classList.toggle('selected');
                if (seatElement.classList.contains('selected')) {
                    selectedSeats.push({ id: seatId, price: seatPrice });
                } else {
                    selectedSeats = selectedSeats.filter(seat => seat.id !== seatId);
                }
                updateSummaryDisplay();
                resetCountdown();
            }
        });
    }

    // Food & Beverage Quantity Buttons
    if (fbItemsGrid) {
        fbItemsGrid.addEventListener('click', (event) => {
            const target = event.target;
            const itemCard = target.closest('.fb-item-card');
            if (!itemCard) return;
            const itemId = itemCard.dataset.fbId;
            const itemName = itemCard.dataset.fbName;
            const itemPrice = parseInt(itemCard.dataset.fbPrice) || 0;
            const quantityDisplay = itemCard.querySelector('.quantity-display');
            let currentQuantity = selectedFbItems[itemId] ? selectedFbItems[itemId].quantity : 0;
            const MAX_QUANTITY = 10;

            if (target.classList.contains('plus')) {
                if (currentQuantity < MAX_QUANTITY) currentQuantity++;
            } else if (target.classList.contains('minus')) {
                if (currentQuantity > 0) currentQuantity--;
            } else {
                 return;
            }
            if (currentQuantity > 0) {
                selectedFbItems[itemId] = { quantity: currentQuantity, price: itemPrice, name: itemName };
            } else {
                delete selectedFbItems[itemId];
            }
            if (quantityDisplay) quantityDisplay.textContent = currentQuantity;
            updateFbSubtotal();
            updateSummaryDisplay();
            resetCountdown();
        });
    }

    // Confirm Button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (bookingFlowSection && bookingFlowSection.classList.contains('hidden')) {
                console.warn("Attempted to confirm booking while not on the booking screen.");
                return;
            }
            if (selectedSeats.length === 0) {
                alert('กรุณาเลือกที่นั่งก่อนทำการยืนยัน');
                return;
            }
            if (!selectedTime) {
                 alert('เกิดข้อผิดพลาด: ไม่ได้เลือกรอบฉาย');
                return;
            }
            clearInterval(countdownInterval);
            updateProgressSteps(3);
            displayConfirmationModal();
        });
    }

     // Confirmation Modal Close Buttons & Backdrop
    if (modal) {
        closeModalButtons?.forEach(button => {
            button.addEventListener('click', () => {
                closeModal(); // ใช้ function เดิมสำหรับ Confirmation Modal
                resetAllSelections();
                showSection('booking-flow-section', true); // กลับไปหน้าแรก เลื่อนขึ้น
                hideSeatAndSummary(() => {
                    updateProgressSteps(1);
                    // No need to scroll top here, showSection handles it
                });
            });
        });
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
                resetAllSelections();
                showSection('booking-flow-section', true); // กลับไปหน้าแรก เลื่อนขึ้น
                hideSeatAndSummary(() => {
                     updateProgressSteps(1);
                    // No need to scroll top here, showSection handles it
                });
            }
        });
    }

    // Trailer Button Click
    trailerButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const youtubeId = button.dataset.youtubeId;
            if (youtubeId && !youtubeId.startsWith('YOUR_')) {
                openTrailerModal(youtubeId);
            } else {
                console.warn("No valid YouTube ID found for this trailer button.");
            }
        });
    });

    // Trailer Modal Close Button & Backdrop
    if (trailerModal) {
        trailerModalCloseBtn?.addEventListener('click', closeTrailerModal);
        trailerModal.addEventListener('click', (event) => {
            if (event.target === trailerModal) {
                closeTrailerModal();
            }
        });
    }

    // --- Login Modal Event Listeners ---

    // Login Button Click
    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (loginModal) {
                loginModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Close Login Modal Buttons (ปุ่ม X และอื่นๆ ที่มี class "close-login-modal")
    if (closeLoginModalButtons) {
        closeLoginModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeLoginModal();
            });
        });
    }

    // Close Login Modal on Backdrop Click
    if (loginModal) {
        loginModal.addEventListener('click', (event) => {
            if (event.target === loginModal) {
                closeLoginModal();
            }
        });
    }

    // Login Form Submission (ตัวอย่างจำลอง)
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Login Simulation Successful! (No actual login occurred)');
            closeLoginModal();
        });
    }

    // --- END: Login Modal Event Listeners ---


    // Close Modals with Escape key (แก้ไขเพิ่มเติม)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // Confirmation Modal handling
            if (modal && !modal.classList.contains('hidden')) {
                closeModal();
                resetAllSelections();
                showSection('booking-flow-section', true); // กลับไปหน้าแรก เลื่อนขึ้น
                 hideSeatAndSummary(() => {
                    updateProgressSteps(1);
                 });
            }
            // Trailer Modal handling
            if (trailerModal && !trailerModal.classList.contains('hidden')) {
                closeTrailerModal();
            }
            // Login Modal handling
            if (loginModal && !loginModal.classList.contains('hidden')) {
                closeLoginModal();
            }
        }
    });

    // --- Navigation Event Listeners (แก้ไขให้ส่ง true) ---
    if (navLinkMovies) {
        navLinkMovies.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('booking-flow-section', true); // Major change, scroll top
        });
    }
    if (navLinkBranches) {
        navLinkBranches.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('branch-info-section', true); // Major change, scroll top
        });
    }
    if (navLinkPromotions) {
        navLinkPromotions.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('promotion-section', true); // Major change, scroll top
        });
    }


    // --- Helper Functions ---

    function updateSelectedMovieDetails(movie) {
        if (currentPoster && movie?.poster) {
            currentPoster.src = movie.poster;
            currentPoster.alt = (movie.title || '') + " Poster";
        }
        if (currentMovieTitle && movie?.title) {
            currentMovieTitle.textContent = movie.title;
        }
    }

    function updateSummaryDisplay() {
        if (summaryMovieSpan) summaryMovieSpan.textContent = selectedMovie?.title || '-';
        if (summaryBranchSpan) summaryBranchSpan.textContent = selectedBranch || '-';
        if (summaryDateSpan) summaryDateSpan.textContent = selectedDate ? formatDate(selectedDate) : '-';
        if (summaryTimeSpan) summaryTimeSpan.textContent = selectedTime || '-';

        const seatIds = selectedSeats.map(seat => seat.id).sort();
        const seatTotalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
        if (selectedSeatsSpan) selectedSeatsSpan.textContent = seatIds.length > 0 ? seatIds.join(', ') : '-';
        if (seatCountSpan) seatCountSpan.textContent = selectedSeats.length;

        let fbSummaryText = '-';
        let fbTotalPrice = 0;
        const fbItemsArray = [];
        for (const itemId in selectedFbItems) {
            const item = selectedFbItems[itemId];
            if (item && item.quantity > 0) {
                fbItemsArray.push(`${item.name} x${item.quantity}`);
                fbTotalPrice += item.quantity * item.price;
            }
        }
        if (fbItemsArray.length > 0) fbSummaryText = fbItemsArray.join(', ');

        if (summaryFbItemsSpan) summaryFbItemsSpan.textContent = fbSummaryText;
        if (summaryFbPriceSpan) summaryFbPriceSpan.textContent = fbTotalPrice;

        const overallTotalPrice = seatTotalPrice + fbTotalPrice;
        if (totalPriceSpan) totalPriceSpan.textContent = overallTotalPrice;

        if (confirmBtn) confirmBtn.disabled = selectedSeats.length === 0 || !selectedTime;
    }

    function updateFbSubtotal() {
        let subtotal = 0;
        for (const itemId in selectedFbItems) {
            const item = selectedFbItems[itemId];
             if (item && item.quantity > 0) {
                 subtotal += item.quantity * item.price;
             }
        }
        if (fbSubtotalPriceSpan) fbSubtotalPriceSpan.textContent = subtotal;
    }

    function resetTimeSelection() {
        selectedTime = null;
        const currentSelectedTimeBtn = timeButtonsContainer?.querySelector('.selected-time');
        if (currentSelectedTimeBtn) {
            currentSelectedTimeBtn.classList.remove('selected-time');
        }
    }

    function resetAllSelections() {
        resetTimeSelection();
        seatsContainer?.querySelectorAll('.seat.selected').forEach(seat => seat.classList.remove('selected'));
        selectedSeats = [];
        selectedFbItems = {};
        document.querySelectorAll('.fb-item-card .quantity-display').forEach(display => {
            if(display) display.textContent = '0';
        });
        updateFbSubtotal();
        updateSummaryDisplay();
        clearInterval(countdownInterval);
        if (countdownTimerSpan) countdownTimerSpan.textContent = "10:00";
        timerSeconds = 600;
    }

    function hideSeatAndSummary(callback) {
        let sectionsToHideCount = 0;
        let sectionsHiddenCount = 0;
        const sections = [seatingSection, fbSection, summarySection];
        const timeoutDuration = FADE_DURATION + 50;

        const onHideComplete = () => {
            sectionsHiddenCount++;
            if (sectionsHiddenCount >= sectionsToHideCount) {
                 clearInterval(countdownInterval);
                 if (countdownTimerSpan) countdownTimerSpan.textContent = "10:00";
                 if (callback) callback();
            }
        };

        sections.forEach(section => {
            if (section && !section.classList.contains('hidden')) {
                sectionsToHideCount++;
                section.classList.add('fade-out');
                setTimeout(() => {
                    section.classList.add('hidden');
                    section.classList.remove('fade-out', 'fade-in');
                    onHideComplete();
                }, timeoutDuration);
            } else {
                // If already hidden, still count towards completion for the callback
                onHideComplete();
            }
        });

        // If no sections needed hiding initially, run callback immediately
        if (sectionsToHideCount === 0 && callback) {
             clearInterval(countdownInterval); // Ensure timer stops
             if (countdownTimerSpan) countdownTimerSpan.textContent = "10:00";
             callback();
        }
    }


    function showSeatAndSummary() {
        seatsContainer?.querySelectorAll('.seat.selected').forEach(seat => seat.classList.remove('selected'));
        selectedSeats = [];
        updateSummaryDisplay();

        const sections = [seatingSection, fbSection, summarySection];
        sections.forEach(section => {
             if (section) {
                 section.classList.remove('hidden', 'fade-out');
                 void section.offsetWidth; // Force reflow
                 section.classList.add('fade-in');
             }
        });
        startCountdown();
    }

    function startCountdown() {
        clearInterval(countdownInterval);
        timerSeconds = 600;
        updateTimerDisplay();
        countdownInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            if (timerSeconds < 0) {
                clearInterval(countdownInterval);
                alert('ขออภัย, หมดเวลาในการเลือกที่นั่ง/อาหารแล้ว กรุณาเริ่มใหม่อีกครั้ง');
                resetAllSelections();
                hideSeatAndSummary(() => {
                    updateProgressSteps(1);
                     const movieSelectionElement = document.querySelector('.movie-selection');
                     if (movieSelectionElement) {
                        movieSelectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     }
                });
            }
        }, 1000);
    }

    function resetCountdown() {
         if(countdownInterval && timerSeconds > 0) {
             timerSeconds = 600;
             updateTimerDisplay();
         }
    }

    function updateTimerDisplay() {
        if (!countdownTimerSpan) return;
        const minutes = Math.floor(Math.max(0, timerSeconds) / 60);
        const seconds = Math.max(0, timerSeconds) % 60;
        countdownTimerSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function showLoading() {
        loadingOverlay?.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay?.classList.add('hidden');
    }

    function updateProgressSteps(stepNumber) {
        if (bookingFlowSection && !bookingFlowSection.classList.contains('hidden')) {
             if (progressSection && !progressSection.classList.contains('hidden')) {
                document.querySelectorAll('.progress-steps .step').forEach((step, index) => {
                    step.classList.remove('active');
                    if ((index + 1) <= stepNumber) {
                        step.classList.add('active');
                    }
                });
             }
        }
    }

    function displayConfirmationModal() {
        if (!modal || !modalSummaryDiv) return;
        const seatTotalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
        const seatIds = selectedSeats.map(seat => seat.id).sort().join(', ') || '-';
        let fbModalItemsHTML = '';
        let fbTotalPrice = 0;
        for (const itemId in selectedFbItems) {
            const item = selectedFbItems[itemId];
            if (item && item.quantity > 0) {
                 fbModalItemsHTML += `<p style="margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dotted var(--border-color);"><strong>${item.name} x${item.quantity}:</strong> <span>${item.quantity * item.price} ฿</span></p>`;
                fbTotalPrice += item.quantity * item.price;
            }
        }
        const fbSubtotalLine = fbTotalPrice > 0
             ? `<p><strong>ราคารวม F&B:</strong> <span style="font-weight:bold;">${fbTotalPrice} ฿</span></p>`
             : '';
        const overallTotalPrice = seatTotalPrice + fbTotalPrice;
        modalSummaryDiv.innerHTML = `
            <p><strong>ภาพยนตร์:</strong> <span>${selectedMovie?.title || '-'}</span></p>
            <p><strong>สาขา:</strong> <span>${selectedBranch || '-'}</span></p>
            <p><strong>วันที่:</strong> <span>${selectedDate ? formatDate(selectedDate) : '-'}</span></p>
            <p><strong>รอบฉาย:</strong> <span>${selectedTime || '-'}</span></p>
            <p><strong>ที่นั่ง (${selectedSeats.length}):</strong> <span>${seatIds}</span></p>
            ${fbModalItemsHTML ? '<hr style="border-top: 1px dashed var(--border-color); margin: 10px 0;">' + fbModalItemsHTML : ''}
            ${fbSubtotalLine ? fbSubtotalLine : ''}
            <hr style="border-top: 1px solid var(--border-color); margin: 15px 0;">
            <p style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;"><strong>ราคารวมสุทธิ:</strong> <span style="color: var(--accent-red); font-weight: bold; font-size: 1.2em;">${overallTotalPrice} บาท</span></p>
        `;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Function เดิมสำหรับปิด Confirmation Modal
    function closeModal() {
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Function สำหรับปิด Login Modal
    function closeLoginModal() {
        if (!loginModal) return;
        loginModal.classList.add('hidden');
        document.body.style.overflow = '';
        // loginForm.reset(); // Uncomment if you want to clear the form on close
    }

    function openTrailerModal(youtubeId) {
        if (!trailerModal || !youtubePlayerContainer) return;
        youtubePlayerContainer.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>`;
        trailerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeTrailerModal() {
        if (!trailerModal || !youtubePlayerContainer) return;
        youtubePlayerContainer.innerHTML = '';
        trailerModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function formatDate(dateString) {
         try {
            if (!dateString) return '-';
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                if (!isNaN(parseInt(year)) && !isNaN(parseInt(month)) && !isNaN(parseInt(day))) {
                     return `${day}/${month}/${year}`;
                }
            }
            console.error("Invalid date string format:", dateString);
            return dateString;
         } catch (error) {
             console.error("Error formatting date:", dateString, error);
             return dateString;
         }
    }

    // --- Function to Show/Hide Main Sections (แก้ไขแล้ว) ---
    function showSection(sectionIdToShow, isMajorChange = true) { // เพิ่ม Parameter isMajorChange
        const sectionToShow = document.getElementById(sectionIdToShow);
        if (!sectionToShow) {
            console.error("Section not found:", sectionIdToShow);
            return;
        }

        let wasAlreadyVisible = !sectionToShow.classList.contains('hidden'); // เช็คว่า section ที่จะแสดง ซ่อนอยู่หรือไม่

        // 1. Hide all other main sections
        allMainSections.forEach(section => {
            if (section && section.id !== sectionIdToShow && !section.classList.contains('hidden')) {
                section.classList.add('fade-out');
                setTimeout(() => {
                    section.classList.add('hidden');
                    section.classList.remove('fade-out', 'fade-in');
                }, FADE_DURATION);
            } else if (section && section.id !== sectionIdToShow) {
                 section.classList.add('hidden');
                 section.classList.remove('fade-in', 'fade-out');
            }
        });

        // 2. Show the target section
        setTimeout(() => {
            sectionToShow.classList.remove('hidden', 'fade-out');
            void sectionToShow.offsetWidth; // Force reflow
            sectionToShow.classList.add('fade-in');

            // 3. Update active nav link
            allNavLinks.forEach(link => link.classList.remove('active'));
            let activeLink;
            if (sectionIdToShow === 'booking-flow-section') activeLink = navLinkMovies;
            else if (sectionIdToShow === 'branch-info-section') activeLink = navLinkBranches;
            else if (sectionIdToShow === 'promotion-section') activeLink = navLinkPromotions;
            if (activeLink) activeLink.classList.add('active');

            // 4. Show/Hide progress bar
            if (progressSection) {
                if (sectionIdToShow === 'booking-flow-section') {
                    progressSection.classList.remove('hidden');
                     let currentStep = 1;
                     if(selectedTime) currentStep = 2;
                    updateProgressSteps(currentStep);
                } else {
                    progressSection.classList.add('hidden');
                }
            }

            // *** 5. Scroll to top ONLY if it's a major section change ***
            // *** and the target section wasn't already visible ***
            if (isMajorChange && !wasAlreadyVisible) {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
            }

        }, 50); // Small delay
    }

}); // End DOMContentLoaded