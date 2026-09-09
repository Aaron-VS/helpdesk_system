import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState("");
const [commentLoading, setCommentLoading] = useState(false);

const [rating, setRating] = useState(0);
const [ratingComment, setRatingComment] = useState("");
const [ratingLoading, setRatingLoading] = useState(false);
const [existingRating, setExistingRating] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "Technical",
    priority: "Medium",
  });

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser.role !== "Customer") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    fetchTickets();
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tickets");

      setTickets(response.data.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Unable to load your tickets."
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchComments = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}/comments`);
    setComments(response.data.data || []);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    setComments([]);
  }
};

const fetchRating = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}/rating`);
    setExistingRating(response.data.data || null);
  } catch (error) {
    setExistingRating(null);
  }
};

 const viewTicket = async (ticketId) => {
  try {
    setDetailsLoading(true);
    setError("");

    const response = await api.get(`/tickets/${ticketId}`);

    setSelectedTicket(response.data.data);

    await fetchComments(ticketId);
    await fetchRating(ticketId);

    setRating(0);
    setRatingComment("");
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.message ||
      "Unable to load ticket details."
    );
  } finally {
    setDetailsLoading(false);
  }
};
  

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !selectedTicket) {
      return;
    }

    try {
      setCommentLoading(true);
      setError("");

      await api.post(`/tickets/${selectedTicket._id}/comments`, {
        message: newComment.trim(),
      });

      setNewComment("");
      await fetchComments(selectedTicket._id);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Unable to add comment."
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();

    if (!selectedTicket || rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setRatingLoading(true);
      setError("");

      await api.post(`/tickets/${selectedTicket._id}/rating`, {
        score: rating,
        comment: ratingComment.trim(),
      });

      await fetchRating(selectedTicket._id);

      setRating(0);
      setRatingComment("");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Unable to submit rating."
      );
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      await api.post("/tickets", newTicket);

      setNewTicket({
        subject: "",
        description: "",
        category: "Technical",
        priority: "Medium",
      });

      setShowCreate(false);

      await fetchTickets();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Unable to create ticket."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Open":
        return "status-open";

      case "In Progress":
        return "status-progress";

      case "On Hold":
        return "status-hold";

      case "Resolved":
        return "status-resolved";

      case "Closed":
        return "status-closed";

      default:
        return "";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Low":
        return "priority-low";

      case "Medium":
        return "priority-medium";

      case "High":
        return "priority-high";

      case "Critical":
        return "priority-critical";

      default:
        return "";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString();
  };

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "Resolved" &&
      ticket.status !== "Closed"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "Resolved" ||
      ticket.status === "Closed"
  ).length;

  const breachedTickets = tickets.filter(
    (ticket) => ticket.slaBreached
  ).length;

  return (
    <div className="dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="logo">🎧</div>

          <div>
            <h2>HelpDesk</h2>
            <span>Customer Portal</span>
          </div>
        </div>

        <nav>
          <button className="nav-item active">
            <span>📊</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => setShowCreate(true)}
          >
            <span>➕</span>
            Create Ticket
          </button>
        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>

            <div>
              <strong>{user?.name || "Customer"}</strong>
              <span>{user?.email || ""}</span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>


      {/* MAIN */}

      <main className="main-content">

        <header className="topbar">

          <div>
            <h1>Customer Dashboard</h1>

            <p>
              Welcome back, {user?.name || "Customer"}.
              Here's an overview of your support requests.
            </p>
          </div>

          <button
            className="create-button"
            onClick={() => setShowCreate(true)}
          >
            + Create Ticket
          </button>

        </header>


        {/* ERROR */}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}


        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon blue">🎫</div>

            <div>
              <span>Total Tickets</span>
              <strong>{tickets.length}</strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon orange">⏳</div>

            <div>
              <span>Open Tickets</span>
              <strong>{openTickets}</strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon green">✓</div>

            <div>
              <span>Resolved</span>
              <strong>{resolvedTickets}</strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon red">⚠</div>

            <div>
              <span>SLA Breaches</span>
              <strong>{breachedTickets}</strong>
            </div>
          </div>

        </section>


        {/* TICKETS */}

        <section className="content-card">

          <div className="section-header">

            <div>
              <h2>My Tickets</h2>
              <p>Track and manage your support requests.</p>
            </div>

            <button
              className="secondary-button"
              onClick={fetchTickets}
            >
              ↻ Refresh
            </button>

          </div>


          {loading ? (

            <div className="empty-state">
              <div className="spinner"></div>
              <p>Loading your tickets...</p>
            </div>

          ) : tickets.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🎫
              </div>

              <h3>No tickets yet</h3>

              <p>
                You haven't created any support tickets.
              </p>

              <button
                className="create-button"
                onClick={() => setShowCreate(true)}
              >
                Create Your First Ticket
              </button>

            </div>

          ) : (

            <div className="ticket-list">

              {tickets.map((ticket) => (

                <div
                  className="ticket-row"
                  key={ticket._id}
                  onClick={() => viewTicket(ticket._id)}
                >

                  <div className="ticket-main">

                    <div className="ticket-id">
                      #{ticket._id.slice(-6).toUpperCase()}
                    </div>

                    <h3>
                      {ticket.subject}
                    </h3>

                    <p>
                      {ticket.description}
                    </p>

                    <div className="ticket-meta">

                      <span>
                        {ticket.category}
                      </span>

                      <span>
                        Created {formatDate(ticket.createdAt)}
                      </span>

                    </div>

                  </div>


                  <div className="ticket-right">

                    <span
                      className={`badge ${getPriorityClass(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>

                    <span
                      className={`badge ${getStatusClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>

                    <span className="arrow">
                      →
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* TICKET DETAILS */}

        {selectedTicket && (

          <section className="content-card ticket-details">

            <div className="section-header">

              <div>
                <h2>{selectedTicket.subject}</h2>

                <p>
                  Ticket #
                  {selectedTicket._id.slice(-6).toUpperCase()}
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </button>

            </div>


            {detailsLoading ? (

              <div className="empty-state">
                Loading ticket...
              </div>

            ) : (

              <>

                <div className="detail-badges">

                  <span
                    className={`badge ${getStatusClass(
                      selectedTicket.status
                    )}`}
                  >
                    {selectedTicket.status}
                  </span>

                  <span
                    className={`badge ${getPriorityClass(
                      selectedTicket.priority
                    )}`}
                  >
                    {selectedTicket.priority}
                  </span>

                  <span className="badge badge-category">
                    {selectedTicket.category}
                  </span>

                </div>


                <div className="description-box">

                  <h3>Description</h3>

                  <p>
                    {selectedTicket.description}
                  </p>

                </div>


                <div className="details-grid">

                  <div>
                    <span>Created</span>
                    <strong>
                      {formatDate(selectedTicket.createdAt)}
                    </strong>
                  </div>

                  <div>
                    <span>SLA Due</span>
                    <strong>
                      {formatDate(selectedTicket.slaDueAt)}
                    </strong>
                  </div>

                  <div>
                    <span>Assigned Agent</span>
                    <strong>
                      {selectedTicket.assignedAgentId?.name ||
                        "Not assigned"}
                    </strong>
                  </div>

                  <div>
                    <span>SLA Status</span>
                    <strong
                      className={
                        selectedTicket.slaBreached
                          ? "danger-text"
                          : "success-text"
                      }
                    >
                      {selectedTicket.slaBreached
                        ? "Breached"
                        : "Within SLA"}
                    </strong>
                  </div>

                </div>


                {/* COMMENTS */}

                <div className="ticket-section">

                  <div className="section-header">
                    <div>
                      <h3>Comments</h3>
                      <p>Communication related to this support ticket.</p>
                    </div>
                  </div>

                  <div className="comments-list">

                    {comments.length === 0 ? (

                      <div className="empty-state">
                        <p>No comments yet.</p>
                      </div>

                    ) : (

                      comments.map((comment) => (

                        <div
                          className="comment-item"
                          key={comment._id}
                        >

                          <div className="comment-header">

                            <strong>
                              {comment.authorId?.name || "User"}
                            </strong>

                            {comment.authorId?.role && (
                              <span>
                                {comment.authorId.role}
                              </span>
                            )}

                            <small>
                              {formatDate(comment.createdAt)}
                            </small>

                          </div>

                          <p>{comment.message}</p>

                        </div>

                      ))

                    )}

                  </div>

                  <form
                    onSubmit={handleAddComment}
                    className="comment-form"
                  >

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows="3"
                    />

                    <button
                      type="submit"
                      className="create-button"
                      disabled={
                        commentLoading ||
                        !newComment.trim()
                      }
                    >
                      {commentLoading
                        ? "Posting..."
                        : "Post Comment"}
                    </button>

                  </form>

                </div>


                {/* RATING */}

                {selectedTicket.status === "Closed" && (

                  <div className="ticket-section">

                    <div className="section-header">
                      <div>
                        <h3>Rate Your Experience</h3>
                        <p>
                          Your feedback helps us improve our support.
                        </p>
                      </div>
                    </div>

                    {existingRating ? (

                      <div className="existing-rating">

                        <p>
                          <strong>Your Rating:</strong>{" "}
                          <span className="display-stars">
                            {"★".repeat(existingRating.score)}
                            {"☆".repeat(5 - existingRating.score)}
                          </span>
                        </p>

                        {existingRating.comment && (
                          <p>
                            <strong>Your Feedback:</strong>{" "}
                            {existingRating.comment}
                          </p>
                        )}

                      </div>

                    ) : (

                      <form
                        onSubmit={handleSubmitRating}
                        className="rating-form"
                      >

                        <p>
                          How was your experience with our support?
                        </p>

                        <div className="star-rating">

                          {[1, 2, 3, 4, 5].map((star) => (

                            <button
                              type="button"
                              key={star}
                              className={`star-button ${
                                star <= rating ? "selected" : ""
                              }`}
                              onClick={() => setRating(star)}
                              aria-label={`${star} star`}
                            >
                              ★
                            </button>

                          ))}

                        </div>

                        <textarea
                          value={ratingComment}
                          onChange={(e) =>
                            setRatingComment(e.target.value)
                          }
                          placeholder="Tell us about your experience (optional)"
                          rows="3"
                        />

                        <button
                          type="submit"
                          className="create-button"
                          disabled={
                            ratingLoading ||
                            rating === 0
                          }
                        >
                          {ratingLoading
                            ? "Submitting..."
                            : "Submit Rating"}
                        </button>

                      </form>

                    )}

                  </div>

                )}

              </>

            )}

          </section>

        )}

      </main>


      {/* CREATE TICKET MODAL */}

      {showCreate && (

        <div
          className="modal-overlay"
          onClick={() => setShowCreate(false)}
        >

          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <div>
                <h2>Create Support Ticket</h2>
                <p>Tell us what you need help with.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>

            </div>


            <form onSubmit={handleCreateTicket}>

              <label>
                Subject
              </label>

              <input
                type="text"
                placeholder="Briefly describe your issue"
                value={newTicket.subject}
                onChange={(e) =>
                  setNewTicket({
                    ...newTicket,
                    subject: e.target.value,
                  })
                }
                required
              />


              <label>
                Description
              </label>

              <textarea
                rows="5"
                placeholder="Describe your issue in detail..."
                value={newTicket.description}
                onChange={(e) =>
                  setNewTicket({
                    ...newTicket,
                    description: e.target.value,
                  })
                }
                required
              />


              <div className="form-row">

                <div>

                  <label>
                    Category
                  </label>

                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="Technical">
                      Technical
                    </option>

                    <option value="Billing">
                      Billing
                    </option>

                    <option value="Account">
                      Account
                    </option>

                    <option value="General">
                      General
                    </option>
                  </select>

                </div>


                <div>

                  <label>
                    Priority
                  </label>

                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">
                      Critical
                    </option>
                  </select>

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-button"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Ticket"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default CustomerDashboard;