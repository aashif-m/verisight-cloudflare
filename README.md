## Description

[Verisight](https://verisightlabs.com/) uses AI and community efforts to help people assess the credibility of news articles. It evaluates the incongruency of articles by analyzing inconsistencies between headlines and the body, provides summaries, and allows users to add notes to provide additional context. It also cross-references articles through AI to show inconsistencies. Its primary objective is to empower users to avoid spreading misinformation.

## Prerequisites

Before running the Verisight Backend locally, ensure you have the following installed:

- [Bun](https://bun.sh/docs/installation)
- [Tavily API](https://tavily.com/)

## Installation

Follow the steps below to set up and run the Verisight Backend locally:

```bash

# Cloning repository

$  git clone https://github.com/verisight/verisight-backend.git

# Install dependencies

$  bun  install

# Development mode

$  bun dev

```

## Secrets and Variables

The Verisight Backend uses the following environment variables:

- `JWT_SECRET`

```bash
$ bunx wrangler secret put JWT_SECRET
``` 

- `TAVILY_API_KEY`
```bash
$ bunx wrangler secret put TAVILY_API_KEY

```
## Deployment

The Verisight Backend is deployed using Cloudflare Workers.
    
```bash
# Production mode

$  bun deploy
```

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/aashif-m/verisight-cloudflare/blob/e15409971846e55bec3bef722a1ce0da76d7f1a4/LICENSE) for more details.

## Acknowledgements

This project was forked from our main repository from [Verisight](https://github.com/verisight)

## Support

For any questions or suggestions, please contact us at support@verisightlabs.com.

## Contributors

| Name                | Email                      | GitHub                                        |
| ------------------- | -------------------------- | --------------------------------------------- |
| Pragash Sasitharan  | Pragash@verisightlabs.com  | [Pragash](https://github.com/PPT1001)         |
| Mohamed Aashif      | Aashif@verisightlabs.com   | [Aashif](https://github.com/aashif-m)         |
| Sudesh Tharoosh     | Tharoosh@verisightlabs.com | [Tharoosh](https://github.com/SudeshTharoosh) |
| Mohamed Ishma       | Ishma@verisightlabs.com    | [Ishma](https://github.com/ishmaifan)         |
| Santosh Manoharadas | Santosh@verisightlabs.com  | [Santosh](https://github.com/MS1145)          |
