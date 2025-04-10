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
      name: "Flappy Man",
      iconUrl: `${appUrl}/flappy_icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/flappy_image.png`,
      buttonTitle: "Play Now!",
      splashImageUrl: `${appUrl}/flappy_icon.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
