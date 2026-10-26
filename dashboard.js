
/* ORGANIZER DASHBOARD */

let events = JSON.parse(
    localStorage.getItem("organizerEvents")
) || [];

let revenueChart;
let ticketChart;


/* OPEN AND CLOSE EVENT FORM */

function openEventForm() {

    document.getElementById("eventFormContainer")
        .style.display = "block";

    document.getElementById("eventFormContainer")
        .scrollIntoView({
            behavior: "smooth"
        });
}

function closeEventForm() {

    document.getElementById("eventFormContainer")
        .style.display = "none";
}


/* CREATE EVENT */

document.getElementById("eventForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const eventName =
            document.getElementById("eventName").value.trim();

        const eventLocation =
            document.getElementById("eventLocation").value.trim();

        const eventDate =
            document.getElementById("eventDate").value;

        const salesCutoff =
            document.getElementById("salesCutoff").value;

        const vipPrice =
            Number(document.getElementById("vipPrice").value);

        const vipQuantity =
            Number(document.getElementById("vipQuantity").value);

        const generalPrice =
            Number(document.getElementById("generalPrice").value);

        const generalQuantity =
            Number(document.getElementById("generalQuantity").value);


        if (new Date(salesCutoff) >= new Date(eventDate + "T23:59:59")) {

            alert("Sales cutoff must be before the event ends.");

            return;
        }

        if (vipQuantity + generalQuantity <= 0) {

            alert("Please add at least one ticket.");

            return;
        }


        const newEvent = {

            id: Date.now(),

            name: eventName,

            location: eventLocation,

            date: eventDate,

            salesCutoff: salesCutoff,

            vipPrice: vipPrice,

            vipQuantity: vipQuantity,

            generalPrice: generalPrice,

            generalQuantity: generalQuantity,

            ticketsSold: 0,

            revenue: 0
        };


        events.push(newEvent);

        saveEvents();

        this.reset();

        closeEventForm();

        renderDashboard();

        alert("Event created successfully!");

    });


/* SAVE EVENTS */

function saveEvents() {

    localStorage.setItem(
        "organizerEvents",
        JSON.stringify(events)
    );
}


/* DASHBOARD STATISTICS */

function updateStatistics() {

    const totalEvents = events.length;

    const totalTicketsSold = events.reduce(
        (sum, event) => sum + event.ticketsSold,
        0
    );

    const totalRevenue = events.reduce(
        (sum, event) => sum + event.revenue,
        0
    );

    // Demo conversion rate.
    // Real conversion requires visitor and booking data.

    const totalVisitors = 1000;

    const conversionRate = totalVisitors > 0
        ? (totalTicketsSold / totalVisitors) * 100
        : 0;


    document.getElementById("totalEvents")
        .textContent = totalEvents;

    document.getElementById("totalTicketsSold")
        .textContent = totalTicketsSold;

    document.getElementById("totalRevenue")
        .textContent = "₹" +
        totalRevenue.toLocaleString("en-IN");

    document.getElementById("conversionRate")
        .textContent = conversionRate.toFixed(1) + "%";
}


/* DISPLAY EVENTS */

function renderEvents() {

    const tableBody =
        document.getElementById("eventsTableBody");

    tableBody.innerHTML = "";

    events.forEach(function (event) {

        const row = document.createElement("tr");

        const totalQuantity =
            event.vipQuantity + event.generalQuantity;

        const ticketText =
            event.ticketsSold + " / " + totalQuantity;

        row.innerHTML = `
            <td>${escapeHTML(event.name)}</td>

            <td>${escapeHTML(event.date)}</td>

            <td>${escapeHTML(event.location)}</td>

            <td>${ticketText}</td>

            <td>₹${event.revenue.toLocaleString("en-IN")}</td>

            <td>
                <span class="event-status">
                    Active
                </span>
            </td>

            <td>
                <button
                    class="delete-event-btn"
                    onclick="deleteEvent(${event.id})">

                    Delete

                </button>
            </td>
        `;

        tableBody.appendChild(row);

    });


    document.getElementById("eventCountLabel")
        .textContent = events.length + " events";
}


/* BASIC HTML ESCAPING */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


/* DELETE EVENT */

function deleteEvent(eventId) {

    const confirmed = confirm(
        "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
        return;
    }

    events = events.filter(function (event) {

        return event.id !== eventId;

    });

    saveEvents();

    renderDashboard();
}


/* REVENUE CHART */

function createRevenueChart() {

    const ctx =
        document.getElementById("revenueChart");

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: events.map(event => event.name),

            datasets: [{

                label: "Revenue (₹)",

                data: events.map(event => event.revenue),

                borderColor: "#6955e8",

                backgroundColor: "rgba(105, 85, 232, 0.1)",

                fill: true,

                tension: 0.4
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: true
                }
            }
        }
    });
}


/* TICKET SALES CHART */

function createTicketChart() {

    const ctx =
        document.getElementById("ticketChart");

    if (ticketChart) {
        ticketChart.destroy();
    }

    ticketChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: ["VIP", "General Admission"],

            datasets: [{

                data: [

                    events.reduce(
                        (sum, event) => sum + event.ticketsSold,
                        0
                    ),

                    events.reduce(

                        (sum, event) => sum +
                        (event.vipQuantity + event.generalQuantity -
                        event.ticketsSold),

                        0
                    )
                ]
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false
        }
    });
}


/* RENDER DASHBOARD */

function renderDashboard() {

    updateStatistics();

    renderEvents();

    createRevenueChart();

    createTicketChart();
}


/* INITIALIZE */

renderDashboard();
