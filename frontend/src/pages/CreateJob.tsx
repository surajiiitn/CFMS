import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, BriefcaseBusiness } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const MIN_DESCRIPTION_WORDS = 15;
const MAX_DESCRIPTION_WORDS = 300;

const countWords = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

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
  const descriptionWordCount = countWords(description);

  const addSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) {
      setSkills((prev) => [...prev, value]);
      setSkillInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !budget || !deadline) {
      toast({ title: "Missing fields", description: "Fill all required fields.", variant: "destructive" });
      return;
    }

    if (descriptionWordCount < MIN_DESCRIPTION_WORDS) {
      toast({
        title: "Description too short",
        description: `Please write at least ${MIN_DESCRIPTION_WORDS} words in the description.`,
        variant: "destructive",
      });
      return;
    }

    if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
      toast({
        title: "Description too long",
        description: `Please keep the description within ${MAX_DESCRIPTION_WORDS} words.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.jobs.create({
        title: title.trim(),
        description: description.trim(),
        skills,
        budget: Number(budget),
        deadline,
        deliverables: deliverables.trim(),
      });
      toast({ title: "Job posted", description: "Your listing is now live." });
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
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">
          Switch to poster role from the top bar to create job listings.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Post a Job">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          <div>
            <h2 className="display-font text-2xl font-semibold text-foreground">Create a new listing</h2>
            <p className="text-sm text-muted-foreground">
              Define scope, skills, budget, and deadline so freelancers can apply quickly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Job Title *</Label>
            <Input
              placeholder="e.g., Design brochure for coding club"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe expectations, context, and acceptance criteria"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
            <p
              className={`text-xs ${
                descriptionWordCount > 0 &&
                (descriptionWordCount < MIN_DESCRIPTION_WORDS || descriptionWordCount > MAX_DESCRIPTION_WORDS)
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              Word count: {descriptionWordCount} (min {MIN_DESCRIPTION_WORDS}, max {MAX_DESCRIPTION_WORDS})
            </p>
          </div>

          <div className="space-y-2">
            <Label>Required Skills</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Add skill and press Enter"
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
                Add Skill
              </Button>
            </div>

            {skills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {skill}
                    <button type="button" onClick={() => setSkills((prev) => prev.filter((value) => value !== skill))}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget (₹) *</Label>
              <Input type="number" placeholder="2000" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Deadline *</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deliverables</Label>
            <Textarea
              placeholder="Mention what needs to be delivered"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing
              </>
            ) : (
              "Publish Job"
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateJob;
