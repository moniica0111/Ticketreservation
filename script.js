
function bookEvent(eventName) {
    window.location.href =
        "event-details.html?event=" +
        encodeURIComponent(eventName);
}

const ticketPrices = {
    vip: 1499,
    general: 499
};

const quantities = {
    vip: 0,
    general: 0
};

function changeQuantity(type, amount) {

    const newQuantity = quantities[type] + amount;

    if (newQuantity < 0 || newQuantity > 5) {
        return;
    }

    quantities[type] = newQuantity;

    document.getElementById(type + "Quantity")
        .textContent = quantities[type];

    updateBookingSummary();
}

function updateBookingSummary() {

    const totalTickets =
        quantities.vip + quantities.general;

    const totalAmount =
        quantities.vip * ticketPrices.vip +
        quantities.general * ticketPrices.general;

    document.getElementById("totalTickets")
        .textContent = totalTickets;

    document.getElementById("totalAmount")
        .textContent = "₹" + totalAmount.toLocaleString("en-IN");
}

function proceedToCheckout() {

    const totalTickets =
        quantities.vip + quantities.general;

    if (totalTickets === 0) {
        alert("Please select at least one ticket.");
        return;
    }

    const booking = {
        eventName: document.getElementById("eventTitle").textContent,
        vip: quantities.vip,
        general: quantities.general,
        totalTickets: totalTickets,
        totalAmount:
            quantities.vip * ticketPrices.vip +
            quantities.general * ticketPrices.general
    };

    sessionStorage.setItem(
        "ticketBooking",
        JSON.stringify(booking)
    );

    window.location.href = "checkout.html";
}

/* EVENT SEARCH */

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchValue = this.value.toLowerCase();

        const eventCards =
            document.querySelectorAll(".event-card");

        eventCards.forEach(function (card) {

            const eventName =
                card.querySelector("h3").textContent.toLowerCase();

            card.style.display =
                eventName.includes(searchValue) ? "block" : "none";
        });
    });
}

/* LOAD EVENT NAME */

const params = new URLSearchParams(window.location.search);

const selectedEvent = params.get("event");

if (selectedEvent) {

    const eventTitle = document.getElementById("eventTitle");

    if (eventTitle) {
        eventTitle.textContent = selectedEvent;
    }
}

/* CHECKOUT PAGE */

let countdownInterval;
let remainingSeconds = 600;

const bookingData = JSON.parse(
    sessionStorage.getItem("ticketBooking")
);

function loadCheckout() {

    if (!document.getElementById("checkoutTotal")) {
        return;
    }

    if (!bookingData) {

        document.getElementById("checkoutEventName")
            .textContent = "No booking found";

        document.getElementById("payButton").disabled = true;

        document.getElementById("paymentResult")
            .textContent = "Please select tickets first.";

        return;
    }

    document.getElementById("checkoutEventName")
        .textContent = bookingData.eventName;

    document.getElementById("checkoutVip")
        .textContent = bookingData.vip + " × ₹1,499";

    document.getElementById("checkoutGeneral")
        .textContent = bookingData.general + " × ₹499";

    document.getElementById("checkoutTotal")
        .textContent = "₹" +
        bookingData.totalAmount.toLocaleString("en-IN");

    startCountdown();
}

function startCountdown() {

    const countdownElement =
        document.getElementById("countdown");

    countdownInterval = setInterval(function () {

        if (remainingSeconds <= 0) {

            clearInterval(countdownInterval);

            countdownElement.textContent = "00:00";

            document.getElementById("timerMessage")
                .textContent = "Reservation expired.";

            document.getElementById("payButton").disabled = true;

            document.getElementById("paymentResult")
                .textContent =
                "Your temporary reservation has expired. Please book again.";

            return;
        }

        remainingSeconds--;

        const minutes = Math.floor(
            remainingSeconds / 60
        );

        const seconds = remainingSeconds % 60;

        countdownElement.textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");

    }, 1000);
}

function processPayment() {

    if (!bookingData || remainingSeconds <= 0) {
        return;
    }

    const payButton =
        document.getElementById("payButton");

    const paymentResult =
        document.getElementById("paymentResult");

    payButton.disabled = true;

    payButton.textContent = "Processing Payment...";

    paymentResult.textContent =
        "Waiting for payment gateway response...";

    // Simulate asynchronous payment processing

    setTimeout(function () {

        const paymentApproved = Math.random() < 0.8;

        if (paymentApproved) {

            clearInterval(countdownInterval);

            document.getElementById("timerMessage")
                .textContent = "Payment completed successfully.";

            document.getElementById("countdown")
                .textContent = "PAID";

            paymentResult.innerHTML =
                "Payment Successful!<br>" +
                "Your tickets have been confirmed.";

            payButton.textContent = "Booking Confirmed";

        } else {

            payButton.disabled = false;

            payButton.textContent = "Try Again";

            paymentResult.textContent =
                "Payment Failed. Please try again.";
        }

    }, 2000);
}

// Initialize checkout only on the checkout page

loadCheckout();
