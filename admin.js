
/* ADMIN DASHBOARD */

let adminEvents = JSON.parse(
    localStorage.getItem("organizerEvents")
) || [];


/* DEMO ORGANIZERS */

let organizers = JSON.parse(
    localStorage.getItem("ticketOrganizers")
) || [

    {
        id: 1,
        name: "Music Events Ltd",
        email: "music@example.com",
        status: "Pending"
    },

    {
        id: 2,
        name: "Tech Events India",
        email: "tech@example.com",
        status: "Approved"
    },

    {
        id: 3,
        name: "Chennai Arts",
        email: "arts@example.com",
        status: "Pending"
    }

];


/* SAVE ORGANIZERS */

function saveOrganizers() {

    localStorage.setItem(
        "ticketOrganizers",
        JSON.stringify(organizers)
    );
}


/* UPDATE STATISTICS */

function updateAdminStatistics() {

    const totalEvents = adminEvents.length;

    const totalRevenue = adminEvents.reduce(
        (sum, event) => sum + Number(event.revenue || 0),
        0
    );

    document.getElementById("adminUsers")
        .textContent = organizers.length + 20;

    document.getElementById("adminOrganizers")
        .textContent = organizers.length;

    document.getElementById("adminEvents")
        .textContent = totalEvents;

    document.getElementById("adminRevenue")
        .textContent = "₹" +
        totalRevenue.toLocaleString("en-IN");
}


/* DISPLAY ORGANIZERS */

function renderOrganizers() {

    const table = document.getElementById("organizerTable");

    table.innerHTML = "";

    organizers.forEach(function (organizer) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(organizer.name)}</td>

            <td>${escapeHTML(organizer.email)}</td>

            <td>${escapeHTML(organizer.status)}</td>

            <td>
                <button
                    class="${organizer.status === "Approved"
                        ? "suspend-btn"
                        : "approve-btn"}"

                    onclick="toggleOrganizer(${organizer.id})">

                    ${organizer.status === "Approved"
                        ? "Suspend"
                        : "Approve"}

                </button>
            </td>
        `;

        table.appendChild(row);

    });
}


/* APPROVE OR SUSPEND ORGANIZER */

function toggleOrganizer(id) {

    organizers = organizers.map(function (organizer) {

        if (organizer.id === id) {

            organizer.status =
                organizer.status === "Approved"
                    ? "Suspended"
                    : "Approved";
        }

        return organizer;

    });

    saveOrganizers();

    renderOrganizers();
}


/* DISPLAY ALL EVENTS */

function renderAdminEvents() {

    const table =
        document.getElementById("adminEventTable");

    table.innerHTML = "";

    adminEvents.forEach(function (event) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(event.name)}</td>

            <td>${escapeHTML(event.location)}</td>

            <td>${escapeHTML(event.date)}</td>

            <td>${Number(event.ticketsSold || 0)}</td>

            <td>₹${Number(event.revenue || 0)
                .toLocaleString("en-IN")}</td>

            <td>
                <button
                    class="delete-event-btn"
                    onclick="deleteAdminEvent(${event.id})">

                    Delete

                </button>
            </td>
        `;

        table.appendChild(row);

    });
}


/* DELETE EVENT */

function deleteAdminEvent(id) {

    if (!confirm("Delete this event permanently?")) {
        return;
    }

    adminEvents = adminEvents.filter(
        event => event.id !== id
    );

    localStorage.setItem(
        "organizerEvents",
        JSON.stringify(adminEvents)
    );

    updateAdminStatistics();

    renderAdminEvents();
}


/* HTML ESCAPING */

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


/* INITIALIZE */

saveOrganizers();

updateAdminStatistics();

renderOrganizers();

renderAdminEvents();
