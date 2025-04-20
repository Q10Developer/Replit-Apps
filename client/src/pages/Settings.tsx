import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [exportFormat, setExportFormat] = useState("csv");
  const [skillThreshold, setSkillThreshold] = useState("75");

  // Handle save settings
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure your CV Smart Hire application preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="Your Company" defaultValue="Acme Inc." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" type="email" placeholder="admin@example.com" defaultValue="hr@acmeinc.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="export-format">Default Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="email-notifications" 
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setEmailNotifications(checked);
                  }
                }}
              />
              <Label htmlFor="email-notifications">
                Email notifications for new candidates
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Ranking Settings */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ranking Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-threshold">
                Skill Match Threshold (%)
              </Label>
              <Input
                id="skill-threshold"
                type="number"
                min="0"
                max="100"
                value={skillThreshold}
                onChange={(e) => setSkillThreshold(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Minimum skill match score for candidate to be considered
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auto-status">Automatic Status Assignment</Label>
              <Select defaultValue="enabled">
                <SelectTrigger id="auto-status">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="review-only">Review Only</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Controls whether candidates are automatically assigned statuses based on their scores
              </p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label>Status Thresholds</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shortlist-threshold" className="text-xs">
                    Shortlist (%)
                  </Label>
                  <Input
                    id="shortlist-threshold"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="90"
                  />
                </div>
                <div>
                  <Label htmlFor="review-threshold" className="text-xs">
                    Review (%)
                  </Label>
                  <Input
                    id="review-threshold"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="75"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>
    </div>
  );
};

export default Settings;
