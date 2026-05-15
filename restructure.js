const fs = require('fs');
const file = 'd:/Tailnote/Site/tailnote/components/dashboard/SignatureWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to \n for easier searching
content = content.replace(/\r\n/g, '\n');

const jsxStart = content.indexOf('return (\n    <div className="min-w-0 space-y-8 max-w-full">');
if (jsxStart === -1) {
  console.log('Error: Could not find return statement.');
  process.exit(1);
}

const beforeJsx = content.substring(0, jsxStart);
const jsxStr = content.substring(jsxStart);

const cards = jsxStr.split('</Card>');
const brandCardRaw = cards[0];
const brandCard = brandCardRaw.substring(brandCardRaw.indexOf('<Card>')) + '</Card>';

const installCardRaw = cards[1];
const installCard = '<Card>' + installCardRaw.split('<Card>')[1] + '</Card>';

const previewCardRaw = cards[2];
const previewCard = '<Card className="max-w-full">' + previewCardRaw.split('<Card className="max-w-full">')[1] + '</Card>';

const formStart = previewCard.indexOf('<SignatureForm');
const formEnd = previewCard.indexOf('<div className="grid');
const formSection = previewCard.substring(formStart, formEnd);

let newPreviewCard = previewCard.replace(formSection, '');
newPreviewCard = newPreviewCard.replace(
  '<CardDescription>\n            Sample person for preview — save your details below so they persist when you return. Employees use their own\n            records on the employee page.\n          </CardDescription>',
  '<CardDescription>See your changes in real-time across Desktop and Mobile.</CardDescription>'
);

const newLayout = `  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start max-w-full min-w-0 pb-20">
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        <div className="flex gap-2 pb-2 overflow-x-auto border-b hide-scrollbar">
          <button onClick={() => setActiveTab('brand')} className={\`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors \${activeTab === 'brand' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}\`}>Brand</button>
          <button onClick={() => setActiveTab('blocks')} className={\`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors \${activeTab === 'blocks' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}\`}>Blocks</button>
          <button onClick={() => setActiveTab('details')} className={\`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors \${activeTab === 'details' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}\`}>My Details</button>
          <button onClick={() => setActiveTab('install')} className={\`px-3 py-1.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors \${activeTab === 'install' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}\`}>Install</button>
        </div>

        <div className="pt-2 min-w-0">
          {activeTab === 'brand' && (
            ${brandCard}
          )}
          {activeTab === 'blocks' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-medium">Promotional Blocks</h3>
                <p className="text-sm text-muted-foreground">Test your blocks here. When applied, these will show below your signature.</p>
              </div>
              <ContentBlocksEditor value={contentBlocks} onChange={setContentBlocks} />
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button type="button" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Blocks'}
                </Button>
                {profileMessage && <p className="text-sm text-muted-foreground">{profileMessage}</p>}
              </div>
            </div>
          )}
          {activeTab === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle>My Details</CardTitle>
                <CardDescription>Sample person for preview. Save your details so they persist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                ${formSection}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save details'}
                  </Button>
                  {profileMessage && <p className="text-sm text-muted-foreground">{profileMessage}</p>}
                </div>
              </CardContent>
            </Card>
          )}
          {activeTab === 'install' && (
            ${installCard}
          )}
        </div>
      </div>

      <div className="lg:col-span-7 xl:col-span-8 lg:sticky lg:top-6 min-w-0">
        ${newPreviewCard.replace('className="max-w-full"', 'className="shadow-xl border-primary/10 overflow-hidden"')}
      </div>
    </div>
  );
}`;

fs.writeFileSync(file, beforeJsx + newLayout);
console.log('Restructure successful!');
