import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryWithRules, RuleDoc } from "@/hooks/use-rules";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface RuleFormValues {
  categoryId: string;
  title: string;
  description: string;
  fine: string;
  jailTime: string;
  communityService: string;
  note: string;
}

export function RuleFormDialog({
  open,
  onOpenChange,
  categories,
  initial,
  defaultCategoryId,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryWithRules[];
  initial: RuleDoc | null;
  defaultCategoryId?: string;
  saving: boolean;
  onSubmit: (values: RuleFormValues) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fine, setFine] = useState("");
  const [jailTime, setJailTime] = useState("");
  const [communityService, setCommunityService] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setCategoryId(initial.categoryId);
      setTitle(initial.title);
      setDescription(initial.description ?? "");
      setFine(initial.fine === undefined ? "" : String(initial.fine));
      setJailTime(initial.jailTime === undefined ? "" : String(initial.jailTime));
      setCommunityService(initial.communityService === undefined ? "" : String(initial.communityService));
      setNote(initial.note ?? "");
    } else {
      const firstCategoryId = categories[0]?._id ?? "";
      setCategoryId(
        defaultCategoryId && categories.some((c) => c._id === defaultCategoryId)
          ? defaultCategoryId
          : firstCategoryId,
      );
      setTitle("");
      setDescription("");
      setFine("");
      setJailTime("");
      setCommunityService("");
      setNote("");
    }
    // categories อ้างอิงเฉพาะตอนเปิดฟอร์ม เพื่อไม่ให้รีเซ็ตฟอร์มขณะพิมพ์
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaultCategoryId]);

  const isEdit = initial !== null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId) {
      setError("กรุณาเลือกหมวดหมู่");
      return;
    }
    if (!title.trim()) {
      setError("กรุณากรอกหัวข้อกฎ");
      return;
    }
    setError(null);
    onSubmit({
      categoryId,
      title: title.trim(),
      description: description.trim(),
      fine: fine.trim(),
      jailTime: jailTime.trim(),
      communityService: communityService.trim(),
      note: note.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขกฎ" : "เพิ่มกฎ"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "แก้ไขข้อมูลกฎ — ข้อมูลจะถูกบันทึกลงฐานข้อมูลทันที" : "กรอกข้อมูลกฎใหม่เพื่อบันทึกลงฐานข้อมูล"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-category">หมวดหมู่</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="rule-category" className="w-full">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category, index) => (
                  <SelectItem key={category._id} value={category._id}>
                    {index + 1}. {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-title">หัวข้อกฎ *</Label>
            <Input
              id="rule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น หลบหนีหลังการจับกุม"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-description">รายละเอียด</Label>
            <Textarea
              id="rule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดของกฎ (ถ้ามี)"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-fine">ค่าปรับ (IC)</Label>
              <Input
                id="rule-fine"
                type="text"
                inputMode="decimal"
                value={fine}
                onChange={(e) => setFine(e.target.value)}
                placeholder="เช่น 5000 หรือ x10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-jail">เวลาจำคุก (นาที)</Label>
              <Input
                id="rule-jail"
                type="text"
                inputMode="decimal"
                value={jailTime}
                onChange={(e) => setJailTime(e.target.value)}
                placeholder="เช่น 30 หรือ x2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-community-service">บำเพ็ญ(ครั้ง)</Label>
              <Input
                id="rule-community-service"
                type="text"
                inputMode="decimal"
                value={communityService}
                onChange={(e) => setCommunityService(e.target.value)}
                placeholder="เช่น 5 หรือ x2"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            กรอกตัวเลข หรือข้อความอย่างอื่นได้ เช่น x10, x2 (เว้นว่างได้ถ้าไม่มี)
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-note">หมายเหตุ</Label>
            <Textarea
              id="rule-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "บันทึกการแก้ไข" : "บันทึกกฎ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
