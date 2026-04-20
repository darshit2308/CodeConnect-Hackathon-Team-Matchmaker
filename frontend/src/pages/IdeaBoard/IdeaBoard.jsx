import React, { useEffect, useMemo, useState } from 'react';
import * as API from '../../services/api';
import Card from '../../components/Card';
import SkillChip from '../../components/SkillChip';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './IdeaBoard.css';

const DOMAINS = ['All', 'EdTech', 'HealthTech', 'FinTech', 'GreenTech', 'Social Good', 'AR/VR', 'Gaming', 'Open Domain'];

function normalizeIdea(idea) {
	return {
		...idea,
		skillsNeeded: Array.isArray(idea.skillsNeeded) ? idea.skillsNeeded : [],
		posterUser: idea.posterUser || {},
	};
}

export default function IdeaBoard() {
	const [ideas, setIdeas] = useState([]);
	const [myProjects, setMyProjects] = useState([]);
	const [participatedProjects, setParticipatedProjects] = useState([]);
	const [pendingRequests, setPendingRequests] = useState([]);
	const [myProjectJoinRequests, setMyProjectJoinRequests] = useState({});
	const [activeDomain, setActiveDomain] = useState('All');
	const [search, setSearch] = useState('');
	const [activeTab, setActiveTab] = useState('projects');
	const [viewProject, setViewProject] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [notInterestedIds, setNotInterestedIds] = useState(() => {
		const stored = localStorage.getItem('cc_not_interested_ideas');
		return stored ? JSON.parse(stored) : [];
	});

	const showToast = useToast();
	const { user } = useAuth();

	useEffect(() => {
		localStorage.setItem('cc_not_interested_ideas', JSON.stringify(notInterestedIds));
	}, [notInterestedIds]);

	const handleNotInterested = (ideaId) => {
		setNotInterestedIds(prev => [...prev, ideaId]);
		showToast('Project removed from your view', 'success');
	};

	const fetchIdeas = async () => {
		try {
			const res = await API.getIdeas();
			setIdeas((res.data || []).map(normalizeIdea).filter((idea) => idea.posterUser?.id !== user?.id));
		} catch (err) {
			console.error('Error fetching ideas:', err);
		}
	};

	const fetchMyProjects = async () => {
		try {
			const res = await API.getMyProjects();
			const projects = (res.data || []).map(normalizeIdea);
			setMyProjects(projects);

			const requestMap = {};
			for (const project of projects) {
				try {
					const reqRes = await API.getProjectJoinRequests(project.id);
					requestMap[project.id] = reqRes.data || [];
				} catch (err) {
					requestMap[project.id] = [];
					console.error('Error fetching join requests for project:', project.id, err);
				}
			}
			setMyProjectJoinRequests(requestMap);
		} catch (err) {
			console.error('Error fetching my projects:', err);
		}
	};

	const fetchParticipatedProjects = async () => {
		try {
			const res = await API.getParticipatedProjects();
			setParticipatedProjects((res.data || []).map(normalizeIdea));
		} catch (err) {
			console.error('Error fetching participated projects:', err);
		}
	};

	const fetchPendingRequests = async () => {
		try {
			const res = await API.getPendingJoinRequests();
			setPendingRequests(res.data || []);
		} catch (err) {
			console.error('Error fetching pending requests:', err);
		}
	};

	useEffect(() => {
		fetchIdeas();
		fetchMyProjects();
		fetchParticipatedProjects();
		fetchPendingRequests();
	}, []);

	const hasPending = (ideaId) => pendingRequests.some((request) => request.ideaId === ideaId || request.idea?.id === ideaId);

	const handleJoinTeam = async (idea) => {
		try {
			await API.joinIdea(idea.id);
			await fetchPendingRequests();
			showToast(`Join request sent to ${idea.posterUser?.name || 'the creator'} for "${idea.title}"`, 'success');
		} catch (err) {
			console.error('Error joining idea:', err);
			showToast('Could not send join request', 'error');
		}
	};

	const handleRevokeRequest = async (ideaId) => {
		try {
			await API.revokeJoinRequest(ideaId);
			await fetchPendingRequests();
			showToast('Join request revoked', 'success');
		} catch (err) {
			console.error('Error revoking request:', err);
			showToast('Could not revoke request', 'error');
		}
	};

	const handleAcceptInvite = async (reqId) => {
		try {
			await API.acceptJoinRequest(reqId);
			await fetchPendingRequests();
			showToast('Invitation accepted!', 'success');
		} catch (err) {
			console.error('Error accepting invite:', err);
			showToast('Could not accept invitation', 'error');
		}
	};

	const handleRejectInvite = async (reqId) => {
		try {
			await API.rejectJoinRequest(reqId);
			await fetchPendingRequests();
			showToast('Invitation declined', 'success');
		} catch (err) {
			console.error('Error rejecting invite:', err);
			showToast('Could not decline invitation', 'error');
		}
	};

	const handleAcceptProjectRequest = async (projectId, reqId) => {
		try {
			await API.acceptJoinRequest(reqId);
			setMyProjectJoinRequests(prev => ({
				...prev,
				[projectId]: prev[projectId].map(r => r.id === reqId ? { ...r, status: 'accepted' } : r)
			}));
			showToast('Request accepted', 'success');
		} catch (err) {
			console.error('Error accepting:', err);
			showToast('Could not accept request', 'error');
		}
	};

	const handleRejectProjectRequest = async (projectId, reqId) => {
		try {
			await API.rejectJoinRequest(reqId);
			setMyProjectJoinRequests(prev => ({
				...prev,
				[projectId]: prev[projectId].map(r => r.id === reqId ? { ...r, status: 'rejected' } : r)
			}));
			showToast('Request rejected', 'success');
		} catch (err) {
			console.error('Error rejecting:', err);
			showToast('Could not reject request', 'error');
		}
	};

	const filteredIdeas = useMemo(() => {
		return ideas.filter((idea) => {
			if (notInterestedIds.includes(idea.id)) return false;
			const matchesDomain = activeDomain === 'All' || idea.domain === activeDomain;
			const matchesSearch = !search.trim() || `${idea.title} ${idea.problemStatement} ${idea.solutionDescription}`.toLowerCase().includes(search.toLowerCase());
			return matchesDomain && matchesSearch;
		});
	}, [ideas, activeDomain, search, notInterestedIds]);

	const filteredMyProjects = useMemo(() => {
		return myProjects.filter((idea) => {
			const matchesDomain = activeDomain === 'All' || idea.domain === activeDomain;
			const matchesSearch = !search.trim() || `${idea.title} ${idea.problemStatement} ${idea.solutionDescription}`.toLowerCase().includes(search.toLowerCase());
			return matchesDomain && matchesSearch;
		});
	}, [myProjects, activeDomain, search]);

	const filteredParticipatedProjects = useMemo(() => {
		return participatedProjects.filter((idea) => {
			const matchesDomain = activeDomain === 'All' || idea.domain === activeDomain;
			const matchesSearch = !search.trim() || `${idea.title} ${idea.problemStatement} ${idea.solutionDescription}`.toLowerCase().includes(search.toLowerCase());
			return matchesDomain && matchesSearch;
		});
	}, [participatedProjects, activeDomain, search]);

	return (
		<div className="ib-page hide-scrollbars">
			<div className="ib-container">
				<div className="ib-header">
					<div>
						<h2>Project Board</h2>
						<p className="ib-sub">Browse hackathon projects, manage your requests, and see who wants to join your work</p>
					</div>
					<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Your Project</button>
				</div>

				<div className="ib-tabs">
					<button className={`ib-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Browse Projects</button>
					<button className={`ib-tab ${activeTab === 'myrequests' ? 'active' : ''}`} onClick={() => setActiveTab('myrequests')}>My Requests ({pendingRequests.length})</button>
					<button className={`ib-tab ${activeTab === 'myprojects' ? 'active' : ''}`} onClick={() => setActiveTab('myprojects')}>My Projects ({myProjects.length})</button>
				</div>

				{activeTab === 'projects' && (
					<div className="ib-section">
						<div className="ib-filter-bar">
							<div className="chip-scroll-row">
								{DOMAINS.map((domain) => (
									<div key={domain} className={`domain-chip ${activeDomain === domain ? 'active' : ''}`} onClick={() => setActiveDomain(domain)}>
										{domain}
									</div>
								))}
							</div>
							<div className="ib-filter-right">
								<input type="search" placeholder="Search projects..." value={search} onChange={(event) => setSearch(event.target.value)} />
							</div>
						</div>

						<div className="ib-grid">
							{filteredIdeas.length === 0 ? (
								<div className="empty-state" style={{ gridColumn: '1/-1' }}>
									<div style={{ fontSize: '48px' }}>0</div>
									<h3>No projects found</h3>
									<p>Try a different filter or search term.</p>
								</div>
							) : (
								filteredIdeas.map((idea) => (
									<Card key={idea.id} hoverEffect noPadding className="idea-card">
										<div className="ic-top-strip" data-domain={idea.domain}></div>
										<div className="ic-body">
											<div className="ic-meta-row">
												<span className="ic-domain">{idea.domain}</span>
												<span className="ic-timer green">Open</span>
											</div>
											<h3 className="ic-title">{idea.title}</h3>
											<p className="ic-desc">{idea.problemStatement}</p>
											<div className="ic-skills">
												<span className="ic-s-label">Skills Needed</span>
												<div className="chip-row">
													{idea.skillsNeeded.slice(0, 3).map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
													{idea.skillsNeeded.length > 3 && <span className="ic-more">+{idea.skillsNeeded.length - 3} more</span>}
												</div>
											</div>
											<div className="ic-divider"></div>
											<div className="ic-footer">
												<div className="ic-poster">
													<div className="ic-av">{idea.posterUser?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'}</div>
													<div>
														<div className="ic-p-name">{idea.posterUser?.name || 'Creator'}</div>
														<div className="ic-p-time">Posted recently</div>
													</div>
												</div>
												<div className="ic-actions">
													<button className={`btn btn-primary small-btn ${hasPending(idea.id) ? 'requested' : ''}`} onClick={() => (hasPending(idea.id) ? null : handleJoinTeam(idea))} disabled={hasPending(idea.id)}>
														{hasPending(idea.id) ? 'Request Sent' : 'Join Team'}
													</button>
													<button className="btn btn-ghost small-btn" onClick={() => setViewProject(idea)}>View</button>
													<button className="btn btn-ghost danger small-btn" onClick={() => handleNotInterested(idea.id)}>Not Interested</button>
												</div>
											</div>
										</div>
									</Card>
								))
							)}
						</div>
					</div>
				)}

				{activeTab === 'myrequests' && (
					<div className="ib-section">
						<h3 style={{ marginBottom: '16px' }}>Your Join Requests</h3>
						{pendingRequests.length === 0 ? (
							<div className="empty-state">
								<div style={{ fontSize: '48px' }}>0</div>
								<h3>No pending requests</h3>
								<p>Browse projects and send a request to join a team.</p>
							</div>
						) : (
							<div className="requests-list">
								{pendingRequests.map((request) => (
									<div key={request.id || request.ideaId} className="request-item">
										<div className="request-info">
											<div className="request-title">{request.idea?.title || request.ideaTitle || 'Project'}</div>
											<div className="request-meta">By {request.idea?.posterUser?.name || request.posterName || 'Creator'}</div>
										</div>
										<div className="request-actions">
											{request.status === 'invited' ? (
												<div style={{ display: 'flex', gap: '8px' }}>
													<button className="btn btn-ghost danger" onClick={() => handleRejectInvite(request.id || request.ideaId)}>Decline</button>
													<button className="btn btn-primary" onClick={() => handleAcceptInvite(request.id || request.ideaId)}>Accept Invite</button>
												</div>
											) : (
												<button className="btn btn-ghost danger" onClick={() => handleRevokeRequest(request.idea?.id || request.ideaId)}>
													Revoke Request
												</button>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === 'myprojects' && (
					<div className="ib-section">
						<h3 style={{ marginBottom: '16px' }}>Your Projects</h3>
						{filteredMyProjects.length === 0 ? (
							<div className="empty-state">
								<div style={{ fontSize: '48px' }}>+</div>
								<h3>No projects yet</h3>
								<p>Post your first project so people can join you.</p>
							</div>
						) : (
							filteredMyProjects.map((idea) => (
								<div key={idea.id} style={{ marginBottom: '24px' }}>
									<Card>
										<div className="ic-meta-row">
											<span className="ic-domain">{idea.domain}</span>
											<span className="ic-timer green">Your Project</span>
										</div>
										<h3 className="ic-title">{idea.title}</h3>
										<p className="ic-desc">{idea.problemStatement}</p>
										<div className="chip-row" style={{ marginBottom: '16px' }}>
											{idea.skillsNeeded.slice(0, 3).map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
										</div>
										<button 
											className="btn btn-ghost small-btn" 
											onClick={() => alert('Edit project details feature coming soon!')}
											style={{ border: '1px solid var(--border)', width: 'auto' }}
										>
											Edit Details
										</button>
									</Card>

									<div className="requests-list" style={{ marginTop: '12px' }}>
										{(myProjectJoinRequests[idea.id] || []).length === 0 ? (
											<div className="request-item">
												<div className="request-info">
													<div className="request-title">No join requests yet</div>
													<div className="request-meta">People will show up here when they request to join</div>
												</div>
											</div>
										) : (
											myProjectJoinRequests[idea.id].map((request) => (
												<div key={request.id} className="request-item">
													<div className="request-info">
														<div className="request-title">{request.requesterName || 'Requester'}</div>
														<div className="request-meta">Member · {request.requesterEmail || ''}</div>
													</div>
													<div className="request-actions">
														{request.status === 'accepted' ? (
															<span className="mc-status green" style={{ fontWeight: 800, color: 'var(--success)' }}>Accepted</span>
														) : request.status === 'rejected' ? (
															<span className="mc-status red" style={{ fontWeight: 800, color: 'var(--danger)' }}>Rejected</span>
														) : (
															<div style={{ display: 'flex', gap: '8px' }}>
																<button className="btn btn-ghost danger" onClick={() => handleRejectProjectRequest(idea.id, request.id)}>Reject</button>
																<button className="btn btn-primary" onClick={() => handleAcceptProjectRequest(idea.id, request.id)}>Accept</button>
															</div>
														)}
													</div>
												</div>
											))
										)}
									</div>
								</div>
							))
						)}

						<h3 style={{ marginTop: '48px', marginBottom: '16px' }}>Projects You're Part Of</h3>
						{filteredParticipatedProjects.length === 0 ? (
							<div className="empty-state" style={{ minHeight: '150px' }}>
								<p>You haven't joined any other projects yet.</p>
							</div>
						) : (
							filteredParticipatedProjects.map((idea) => (
								<div key={idea.id} style={{ marginBottom: '24px' }}>
									<Card>
										<div className="ic-meta-row">
											<span className="ic-domain">{idea.domain}</span>
											<span className="ic-timer green">Team Member</span>
										</div>
										<h3 className="ic-title">{idea.title}</h3>
										<p className="ic-desc">{idea.problemStatement}</p>
										<div className="chip-row" style={{ marginBottom: '16px' }}>
											{idea.skillsNeeded.slice(0, 3).map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
										</div>
										<div className="ic-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
											<div className="ic-poster">
												<div className="ic-av">{idea.posterUser?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'}</div>
												<div>
													<div className="ic-p-name">{idea.posterUser?.name || 'Creator'}</div>
													<div className="ic-p-time">Project Owner</div>
												</div>
											</div>
											<div className="ic-actions">
												<button className="btn btn-ghost small-btn" onClick={() => setViewProject(idea)}>View Full Details</button>
											</div>
										</div>
									</Card>
								</div>
							))
						)}
					</div>
				)}
			</div>

			{viewProject && (
				<div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setViewProject(null); }}>
					<div className="modal-card view-project-modal" style={{ padding: 0, overflow: 'hidden', maxWidth: '600px' }}>
						<div className="vp-header-banner" data-domain={viewProject.domain} style={{ height: '140px', position: 'relative', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
							<button className="modal-close" onClick={() => setViewProject(null)} style={{ color: 'white', background: 'rgba(0,0,0,0.2)', top: '16px', right: '16px' }}>×</button>
							<div className="vp-domain-badge" style={{ position: 'absolute', bottom: '16px', left: '32px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '13px' }}>{viewProject.domain}</div>
						</div>
						<div className="vp-content hide-scrollbars" style={{ padding: '32px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
							<h2 style={{ fontSize: '28px', marginBottom: '24px', lineHeight: '1.2' }}>{viewProject.title}</h2>
							
							<div className="vp-poster-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '16px' }}>
								<div className="ic-av" style={{ width: '56px', height: '56px', fontSize: '20px' }}>{viewProject.posterUser?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'}</div>
								<div>
									<div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)' }}>{viewProject.posterUser?.name || 'Creator'}</div>
									<div style={{ fontSize: '14px', color: 'var(--ink3)' }}>Project Owner</div>
								</div>
							</div>

							<div className="vp-section" style={{ marginBottom: '24px' }}>
								<h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink3)', marginBottom: '12px' }}>
									<span style={{ fontSize: '18px' }}>🎯</span> Problem Statement
								</h4>
								<p style={{ lineHeight: '1.6', color: 'var(--ink)', fontSize: '16px' }}>{viewProject.problemStatement}</p>
							</div>

							<div className="vp-section" style={{ marginBottom: '24px' }}>
								<h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink3)', marginBottom: '12px' }}>
									<span style={{ fontSize: '18px' }}>💡</span> Solution
								</h4>
								<p style={{ lineHeight: '1.6', color: 'var(--ink)', fontSize: '16px' }}>{viewProject.solutionDescription || 'No solution description added yet.'}</p>
							</div>

							<div className="vp-section" style={{ marginBottom: '32px' }}>
								<h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink3)', marginBottom: '12px' }}>
									<span style={{ fontSize: '18px' }}>🛠️</span> Skills Needed
								</h4>
								<div className="chip-row">
									{viewProject.skillsNeeded.map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
								</div>
							</div>

							<div className="vp-actions" style={{ display: 'flex', gap: '12px' }}>
								<button className="btn btn-ghost" style={{ flex: 1, padding: '14px' }} onClick={() => setViewProject(null)}>Close</button>
								<button className={`btn btn-primary ${hasPending(viewProject.id) ? 'requested' : ''}`} style={{ flex: 2, padding: '14px', fontSize: '16px' }} onClick={() => (hasPending(viewProject.id) ? null : handleJoinTeam(viewProject))} disabled={hasPending(viewProject.id)}>
									{hasPending(viewProject.id) ? 'Join Request Sent ✅' : 'Send Join Request'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{showModal && <PostProjectModal onClose={() => setShowModal(false)} onPosted={() => { setShowModal(false); fetchMyProjects(); showToast('Project posted! Others can now join you.', 'success'); }} />}
		</div>
	);
}

function PostProjectModal({ onClose, onPosted }) {
	const { user } = useAuth();
	const showToast = useToast();
	const [title, setTitle] = useState('');
	const [domain, setDomain] = useState(DOMAINS[8]);
	const [problemStatement, setProblemStatement] = useState('');
	const [solutionDescription, setSolutionDescription] = useState('');
	const [skillsNeeded, setSkillsNeeded] = useState('');
	const [hackathon, setHackathon] = useState('');

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			await API.postIdea({
				title,
				domain,
				problemStatement,
				solutionDescription,
				skillsNeeded: skillsNeeded.split(',').map((skill) => skill.trim()).filter(Boolean),
				hackathon,
				posterUser: user?.id,
			});
			onPosted();
		} catch (err) {
			console.error('Error posting project:', err);
			showToast('Could not post project', 'error');
		}
	};

	return (
		<div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
			<div className="modal-card">
				<button className="modal-close" onClick={onClose}>×</button>
				<h2>Post Your Project</h2>
				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label>Project Title</label>
						<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your project a catchy name" required />
					</div>
					<div className="form-group">
						<label>Domain</label>
						<select value={domain} onChange={(event) => setDomain(event.target.value)}>
							{DOMAINS.map((item) => <option key={item}>{item}</option>)}
						</select>
					</div>
					<div className="form-group">
						<label>Hackathon</label>
						<input value={hackathon} onChange={(event) => setHackathon(event.target.value)} placeholder="e.g. HackFest 2025" />
					</div>
					<div className="form-group">
						<label>Problem Statement</label>
						<textarea rows="2" value={problemStatement} onChange={(event) => setProblemStatement(event.target.value)} required />
						<div className="char-count">{problemStatement.length} / 300</div>
					</div>
					<div className="form-group">
						<label>Solution</label>
						<textarea rows="2" value={solutionDescription} onChange={(event) => setSolutionDescription(event.target.value)} required />
					</div>
					<div className="form-group">
						<label>Skills Needed (comma separated)</label>
						<input value={skillsNeeded} onChange={(event) => setSkillsNeeded(event.target.value)} placeholder="e.g. Frontend Dev, UI/UX" required />
					</div>
					<div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
						<button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
						<button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Post Project</button>
					</div>
				</form>
			</div>
		</div>
	);
}
