import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { RatingStars } from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Github, Globe, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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
  }, [user?.id]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
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
      toast({ title: "Profile Updated" });
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-5 mb-6">
            <img src={profile.avatar} alt="" className="h-20 w-20 rounded-2xl bg-secondary" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-card-foreground">{profile.name}</h2>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
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
                          <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {skills.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                              {s}
                              <button onClick={() => setSkills(skills.filter((x) => x !== s))}>
                                <X className="h-3 w-3" />
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
              <p className="text-sm text-muted-foreground">{profile.branch || "Campus"} {profile.year ? `• Year ${profile.year}` : ""}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <RatingStars rating={profile.rating} size={14} />
                <span className="text-xs text-muted-foreground ml-1">({profile.rating})</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio || "No bio added yet."}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).map((s) => (
                <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{s}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                <Github className="h-4 w-4" />GitHub
              </a>
            )}
            {profile.portfolio && (
              <a href={profile.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                <Globe className="h-4 w-4" />Portfolio
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Profile;
