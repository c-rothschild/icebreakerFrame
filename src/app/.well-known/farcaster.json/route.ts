export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEwMjQxNTksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg2M0I3NGNmNzJkMDdhZDgwNjEyNjg5NDEwNDlFMDAzMDk5MTNjNUFkIn0",
      payload: "eyJkb21haW4iOiJ0ZXN0ZnJhbWV2Mi52ZXJjZWwuYXBwIn0",
      signature:
        "MHgzOTVhZTdlN2I0YzRmMTAwNDQzMzRmMTEwYzA4ZDFlMGY5YTI3ODkxZTY4NDBiMTRjMzU3ZGE1NjI1MGExM2UzM2RlZDgzZjQzYzRkMGI5ZjhkZmJlZDJlZTVlYjNlM2NiNDBhZjk5NzYwNTVkYjFmNGE3ZTE0NjhjNDZmNDcyNDFj",
    },
    frame: {
      version: "1",
      name: "Icebreaker Frame",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/image.png`,
      buttonTitle: "Launch Frame",
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
