"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Role {
  id: string;
  name: string;
  description: string;
  allowedTools: string[]; // tool IDs
}

export interface User {
  email: string;
  name?: string;
  role: string; // role name or ID
  status: "invited" | "joined";
  invitedAt: string;
  joinedAt?: string;
  token: string;
  password?: string;
}

export interface OrgInfo {
  name: string;
  domain: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  iconName: string;
  url: string;
}

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  token: string;
  sentAt: string;
  read: boolean;
}

interface AppContextType {
  org: OrgInfo;
  updateOrg: (org: Partial<OrgInfo>) => void;
  roles: Role[];
  addRole: (role: Omit<Role, "id">) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  users: User[];
  inviteUser: (email: string, roleName: string) => void;
  joinUser: (token: string, name: string, password: string) => void;
  deleteUser: (email: string) => void;
  tools: Tool[];
  updateAccessMatrix: (roleId: string, toolId: string, allowed: boolean) => void;
  emails: EmailNotification[];
  markEmailAsRead: (id: string) => void;
  clearEmails: () => void;
  resetDatabase: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentInviteToken: string | null;
  setCurrentInviteToken: (token: string | null) => void;
}

const defaultTools: Tool[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Code hosting platform for collaboration and version control.",
    category: "Development",
    color: "from-zinc-800 to-zinc-950 text-white",
    iconName: "Github",
    url: "https://github.com",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack is a new way to communicate with your team.",
    category: "Communication",
    color: "from-purple-500 to-indigo-600 text-white",
    iconName: "Slack",
    url: "https://slack.com",
  },
  {
    id: "notion",
    name: "Notion",
    description: "A new tool that blends your everyday work apps into one.",
    category: "Documentation",
    color: "from-amber-500 to-orange-600 text-white",
    iconName: "BookOpen",
    url: "https://notion.so",
  },
  {
    id: "drive",
    name: "Google Drive",
    description: "Store, share, and collaborate on files and folders.",
    category: "Storage",
    color: "from-blue-500 to-cyan-500 text-white",
    iconName: "HardDrive",
    url: "https://drive.google.com",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Collaborative interface design and prototyping tool.",
    category: "Design",
    color: "from-rose-500 to-red-600 text-white",
    iconName: "Figma",
    url: "https://figma.com",
  },
  {
    id: "linear",
    name: "Linear",
    description: "The issue tracker you've been waiting for.",
    category: "Productivity",
    color: "from-blue-600 to-indigo-700 text-white",
    iconName: "CheckSquare",
    url: "https://linear.app",
  },
];

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full administrative access with control over settings, users, and tools.",
    allowedTools: ["github", "slack", "notion", "drive", "figma", "linear"],
  },
  {
    id: "developer",
    name: "Developer",
    description: "Full access to codebase repositories, developer chat channels, and issue boards.",
    allowedTools: ["github", "slack", "linear"],
  },
  {
    id: "designer",
    name: "Designer",
    description: "Design-focused access for assets, prototypes, documentation, and chat.",
    allowedTools: ["figma", "notion", "slack"],
  },
  {
    id: "pm",
    name: "Product Manager",
    description: "Planning and documentation access including issue tracker, storage, and docs.",
    allowedTools: ["notion", "slack", "linear", "drive"],
  },
];

const defaultUsers: User[] = [
  {
    email: "admin@acme.com",
    name: "Jane Doe",
    role: "Admin",
    status: "joined",
    invitedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    token: "default-admin-token",
  },
  {
    email: "dev@acme.com",
    name: "Alex Dev",
    role: "Developer",
    status: "joined",
    invitedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    token: "default-dev-token",
  },
  {
    email: "design@acme.com",
    role: "Designer",
    status: "invited",
    invitedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    token: "default-design-token",
  },
];

const defaultOrg: OrgInfo = {
  name: "Acme Corp",
  domain: "acme.com",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [org, setOrg] = useState<OrgInfo>(defaultOrg);
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [users, setUsers] = useState<User[]>(defaultUsers);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [currentInviteToken, setCurrentInviteToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOrg = localStorage.getItem("team_agent_org");
      const storedRoles = localStorage.getItem("team_agent_roles");
      const storedUsers = localStorage.getItem("team_agent_users");
      const storedEmails = localStorage.getItem("team_agent_emails");
      const storedCurrentUser = localStorage.getItem("team_agent_current_user");

      if (storedOrg) setOrg(JSON.parse(storedOrg));
      if (storedRoles) setRoles(JSON.parse(storedRoles));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedEmails) setEmails(JSON.parse(storedEmails));
      if (storedCurrentUser) setCurrentUserState(JSON.parse(storedCurrentUser));
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("team_agent_org", JSON.stringify(org));
    }
  }, [org, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("team_agent_roles", JSON.stringify(roles));
    }
  }, [roles, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("team_agent_users", JSON.stringify(users));
    }
  }, [users, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("team_agent_emails", JSON.stringify(emails));
    }
  }, [emails, isLoaded]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("team_agent_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("team_agent_current_user");
    }
  };

  const updateOrg = (newOrg: Partial<OrgInfo>) => {
    setOrg((prev) => ({ ...prev, ...newOrg }));
  };

  const addRole = (role: Omit<Role, "id">) => {
    const id = role.name.toLowerCase().replace(/\s+/g, "-");
    if (roles.some((r) => r.id === id)) return;
    setRoles((prev) => [...prev, { ...role, id }]);
  };

  const updateRole = (id: string, updatedFields: Partial<Role>) => {
    setRoles((prev) =>
      prev.map((role) => (role.id === id ? { ...role, ...updatedFields } : role))
    );
  };

  const deleteRole = (id: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== id));
  };

  const inviteUser = (email: string, roleName: string) => {
    // Check if user already exists
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return;
    }

    const token = `invite-${Math.random().toString(36).substring(2, 9)}`;
    const newUser: User = {
      email,
      role: roleName,
      status: "invited",
      invitedAt: new Date().toISOString(),
      token,
    };

    setUsers((prev) => [newUser, ...prev]);

    // Generate email simulation
    const inviteLink = `${window.location.origin}/invite/${token}`;
    const newEmail: EmailNotification = {
      id: `email-${Math.random().toString(36).substring(2, 9)}`,
      to: email,
      subject: `You have been invited to join ${org.name}`,
      body: `Hi there!\n\nYou have been invited to join the ${org.name} team on our onboarding portal.\n\nYour pre-assigned role is: ${roleName}.\n\nClick the button below to accept the invitation and set up your profile.\n\nBest,\nThe ${org.name} Team`,
      token,
      sentAt: new Date().toISOString(),
      read: false,
    };

    setEmails((prev) => [newEmail, ...prev]);
  };

  const joinUser = (token: string, name: string, password: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.token === token
          ? {
              ...u,
              name,
              password,
              status: "joined",
              joinedAt: new Date().toISOString(),
            }
          : u
      )
    );

    // Auto set current logged in user
    const user = users.find((u) => u.token === token);
    if (user) {
      const updatedUser: User = {
        ...user,
        name,
        password,
        status: "joined",
        joinedAt: new Date().toISOString(),
      };
      setCurrentUser(updatedUser);
    }
  };

  const deleteUser = (email: string) => {
    setUsers((prev) => prev.filter((u) => u.email !== email));
  };

  const updateAccessMatrix = (roleId: string, toolId: string, allowed: boolean) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === roleId) {
          const allowedTools = allowed
            ? [...role.allowedTools, toolId]
            : role.allowedTools.filter((tId) => tId !== toolId);
          return { ...role, allowedTools };
        }
        return role;
      })
    );
  };

  const markEmailAsRead = (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e))
    );
  };

  const clearEmails = () => {
    setEmails([]);
  };

  const resetDatabase = () => {
    setOrg(defaultOrg);
    setRoles(defaultRoles);
    setUsers(defaultUsers);
    setEmails([]);
    setCurrentUser(null);
    setCurrentInviteToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("team_agent_org");
      localStorage.removeItem("team_agent_roles");
      localStorage.removeItem("team_agent_users");
      localStorage.removeItem("team_agent_emails");
      localStorage.removeItem("team_agent_current_user");
    }
  };

  return (
    <AppContext.Provider
      value={{
        org,
        updateOrg,
        roles,
        addRole,
        updateRole,
        deleteRole,
        users,
        inviteUser,
        joinUser,
        deleteUser,
        tools: defaultTools,
        updateAccessMatrix,
        emails,
        markEmailAsRead,
        clearEmails,
        resetDatabase,
        currentUser,
        setCurrentUser,
        currentInviteToken,
        setCurrentInviteToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
