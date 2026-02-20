import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { RatingStars } from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Github, Globe, Edit, X, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { User } from "@/types/cfms";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(user);

  const [bio, setBio] = useState(user?.bio || "");
  const [github, setGithub] = useState(user?.github || "");
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);

  useEffect(() => {
    setProfile(user);
    setBio(user?.bio || "");
    setGithub(user?.github || "");
    setPortfolio(user?.portfolio || "");
    setSkills(user?.skills || []);
  }, [user]);

  const addSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) {
      setSkills((prev) => [...prev, value]);
      setSkillInput("");
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const data = await api.users.updateMe({
        bio,
        github,
        portfolio,
        skills,
      });
      setProfile(data.user);
      setEditOpen(false);
      await refreshUser();
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({
        title: "Unable to update profile",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <DashboardLayout title="Profile">
      <section className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-10 w-10 text-secondary-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="display-font text-2xl font-semibold text-card-foreground">{profile.name}</h2>

              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2 space-y-4">
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <Input value={github} onChange={(e) => setGithub(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Portfolio URL</Label>
                      <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add skill"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addSkill}>
                          Add
                        </Button>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                          >
                            {skill}
                            <button type="button" onClick={() => setSkills((prev) => prev.filter((item) => item !== skill))}>
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" onClick={saveProfile} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <p className="text-sm text-muted-foreground">
              {profile.branch || "Campus"}
              {profile.year ? ` • Year ${profile.year}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>

            <div className="mt-2 flex items-center gap-1">
              <RatingStars rating={profile.rating} size={14} />
              <span className="text-xs text-muted-foreground">({profile.rating})</span>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border/70 bg-background/60 p-4">
          <h3 className="mb-2 text-sm font-semibold text-card-foreground">About</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio || "No bio added yet."}</p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-card-foreground">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).length > 0 ? (
              profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-secondary-foreground/15 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {profile.github ? (
            <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80">
              <Github className="h-4 w-4" /> GitHub
            </a>
          ) : null}
          {profile.portfolio ? (
            <a href={profile.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80">
              <Globe className="h-4 w-4" /> Portfolio
            </a>
          ) : null}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default Profile;
