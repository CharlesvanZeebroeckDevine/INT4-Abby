"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Plus, Edit, Trash2, Users, Eye, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { getCurrentUser, deleteSubmission, getFileUrl } from "../../lib/supabase"
import { setupRealTimeSubscriptions } from "../../lib/real-time"
import { syncOfflineSubmissions, getOfflineSubmissions } from "../../lib/offline-manager"
import { saveUserSession } from "../../lib/user-session"
import Link from "next/link"
import { supabase } from "../../lib/supabaseClient"
import { Modal } from "../../components/ui/modal"
import "./Dashboard.css"

export default function DashboardPage() {
    const [user, setUser] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState(null)
    const [isOnline, setIsOnline] = useState(true)
    const [offlineSubmissions, setOfflineSubmissions] = useState([])
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        loadUserData()
        setupRealTime()
        checkOfflineSubmissions()

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        setIsOnline(navigator.onLine)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    const loadUserData = async () => {
        try {
            const currentUser = await getCurrentUser()
            if (!currentUser) {
                window.location.href = "/"
                return
            }

            setUser(currentUser)

            const { data: userSubmissions, error } = await supabase
                .from("submissions")
                .select("*")
                .eq("contact_email", currentUser.email)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching submissions:", error)
            }

            if (userSubmissions && userSubmissions.length > 0) {
                const latestSubmission = userSubmissions[0]
                saveUserSession({
                    email: currentUser.email,
                    fullName: latestSubmission.contact_name,
                    creatorName: latestSubmission.creator_name,
                    aboutYou: latestSubmission.about_you,
                    avatarColor: latestSubmission.avatar_color,
                })
            }

            setSubmissions(userSubmissions || [])
        } catch (error) {
            console.error("Error loading user data:", error)
        } finally {
            setLoading(false)
        }
    }

    const setupRealTime = () => {
        const callbacks = {
            onNewSubmission: (submission) => {
                if (user && submission.contact_email === user.email) {
                    setSubmissions((prev) => [submission, ...prev])
                }
            },
            onUpdateSubmission: (submission) => {
                if (user && submission.contact_email === user.email) {
                    setSubmissions((prev) => prev.map((sub) => (sub.id === submission.id ? submission : sub)))
                }
            },
            onDeleteSubmission: (submission) => {
                if (user && submission.contact_email === user.email) {
                    setSubmissions((prev) => prev.filter((sub) => sub.id !== submission.id))
                }
            },
        }

        const { cleanup } = setupRealTimeSubscriptions(callbacks)
        return cleanup
    }

    const checkOfflineSubmissions = () => {
        const offline = getOfflineSubmissions()
        setOfflineSubmissions(offline)
    }

    const handleSyncOffline = async () => {
        if (!isOnline || syncing) return

        setSyncing(true)
        try {
            const results = await syncOfflineSubmissions(async (submissionData) => {
                const { saveSubmission } = await import("../../lib/supabase")
                return await saveSubmission(submissionData)
            })

            checkOfflineSubmissions()
            loadUserData()
        } catch (error) {
            console.error("Error syncing offline submissions:", error)
        } finally {
            setSyncing(false)
        }
    }

    const handleDeleteSubmission = async () => {
        if (!selectedSubmission) return

        try {
            const { error } = await deleteSubmission(selectedSubmission.id)
            if (error) throw error

            setSubmissions((prev) => prev.filter((sub) => sub.id !== selectedSubmission.id))
            setDeleteDialogOpen(false)
            setSelectedSubmission(null)
        } catch (error) {
            console.error("Error deleting submission:", error)
            alert("Failed to delete submission. Please try again.")
        }
    }

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard-container">
                    <div className="empty-state">
                        <div className="loading-spinner"></div>
                        <p>Loading your dashboard...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="dashboard-header-content">
                        <h1 className="dashboard-title">
                            Welcome back, {user?.user_metadata?.creator_name || user?.user_metadata?.full_name || "Creator"}!
                        </h1>

                        <div className={`connection-status ${isOnline ? "online" : "offline"}`}>
                            {isOnline ? (
                                <>
                                    <Wifi className="icon" />
                                    <span>Online</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="icon" />
                                    <span>Offline</span>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="dashboard-subtitle">Manage your creative submissions and track their performance</p>

                    {offlineSubmissions.length > 0 && (
                        <div className="offline-alert">
                            <div className="offline-alert-content">
                                <div className="offline-alert-text">
                                    <WifiOff className="icon" />
                                    <p>
                                        You have {offlineSubmissions.length} submission{offlineSubmissions.length !== 1 ? "s" : ""} waiting to
                                        sync
                                    </p>
                                </div>
                                {isOnline && (
                                    <Button onClick={handleSyncOffline} disabled={syncing} className="sync-button">
                                        {syncing ? (
                                            <>
                                                <RefreshCw className="icon spinning" />
                                                Syncing...
                                            </>
                                        ) : (
                                            "Sync Now"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Overview */}
                {submissions.length > 0 && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value green">{submissions.length}</div>
                            <p className="stat-label">Total Submissions</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value blue">
                                {submissions.reduce((total, sub) => total + (sub.artworks?.length || 0), 0)}
                            </div>
                            <p className="stat-label">Artworks Shared</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value purple">
                                {submissions.reduce((total, sub) => total + (sub.votes || 0), 0)}
                            </div>
                            <p className="stat-label">Total Votes</p>
                        </div>
                    </div>
                )}

                {/* Submissions Grid */}
                <div className="submissions-section">
                    <div className="submissions-header">
                        <h2 className="submissions-title">Your Submissions</h2>
                        <Link href="/artwork?returning=true">
                            <Button className="add-button">
                                <Plus className="icon" />
                                Add New Artwork
                            </Button>
                        </Link>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Eye className="icon" />
                            </div>
                            <h3 className="empty-title">No submissions yet</h3>
                            <p className="empty-description">
                                Start sharing your creative vision with the Abby community. Your first submission is just a few clicks
                                away!
                            </p>
                            <Link href="/artwork?returning=true">
                                <Button className="create-button">Create Your First Submission</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="submissions-grid">
                            {submissions.map((submission) => (
                                <div key={submission.id} className="submission-card">
                                    <div className="submission-image">
                                        {submission.artworks?.[0]?.images?.[0] ? (
                                            <img
                                                src={getFileUrl("artworks", submission.artworks[0].images[0]) || "/placeholder.svg"}
                                                alt={submission.artworks[0].title}
                                            />
                                        ) : (
                                            <div className="empty-image">
                                                <Eye className="icon" />
                                            </div>
                                        )}
                                        <div className="artwork-count">
                                            {submission.artworks?.length || 0} artwork{(submission.artworks?.length || 0) !== 1 ? "s" : ""}
                                        </div>
                                    </div>

                                    <div className="submission-content">
                                        <div className="submission-header">
                                            {submission.avatar_image && (
                                                <div
                                                    className="avatar"
                                                    style={{ borderColor: submission.avatar_color || "#01A569" }}
                                                >
                                                    <img
                                                        src={getFileUrl("avatars", submission.avatar_image) || "/placeholder.svg"}
                                                        alt="Avatar"
                                                    />
                                                </div>
                                            )}
                                            <div className="submission-info">
                                                <h3>{submission.creator_name}</h3>
                                                <p className="submission-date">{new Date(submission.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <p className="submission-description">{submission.about_you}</p>

                                        <div className="submission-footer">
                                            <div className="votes">
                                                <Users className="icon" />
                                                <span>{submission.votes || 0} votes</span>
                                            </div>
                                            <span
                                                className={`status-badge ${submission.status === "approved"
                                                    ? "approved"
                                                    : submission.status === "pending"
                                                        ? "pending"
                                                        : "default"
                                                    }`}
                                            >
                                                {submission.status || "submitted"}
                                            </span>
                                        </div>

                                        <div className="submission-actions">
                                            <Button className="edit-button">
                                                <Edit className="icon" />
                                                Edit
                                            </Button>
                                            <Button
                                                className="delete-button"
                                                onClick={() => {
                                                    setSelectedSubmission(submission)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="icon" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    title="Delete Submission"
                    description="Are you sure you want to delete this submission? This action cannot be undone."
                >
                    <div className="modal-actions">
                        <Button className="cancel-button" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="delete-confirm-button" onClick={handleDeleteSubmission}>
                            Delete
                        </Button>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
