import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CreateJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !budget || !deadline) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await api.jobs.create({
        title,
        description,
        skills,
        budget: Number(budget),
        deadline,
        deliverables,
      });
      toast({ title: "Job Posted", description: "Your job has been published successfully." });
      navigate("/jobs");
    } catch (err) {
      toast({
        title: "Unable to post job",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "poster") {
    return (
      <DashboardLayout title="Post a Job">
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Switch to poster role to create a job.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Post a Job">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input placeholder="e.g., Design Club Event Poster" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea placeholder="Describe the job in detail..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
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
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      {s}
                      <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget (₹) *</Label>
                <Input type="number" placeholder="500" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deliverables</Label>
              <Textarea placeholder="What should the freelancer deliver?" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...
                </>
              ) : (
                "Post Job"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CreateJob;
