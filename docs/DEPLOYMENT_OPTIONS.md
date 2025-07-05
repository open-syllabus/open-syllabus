# 🚀 Open Syllabus Deployment Options Guide

This guide helps schools choose the right deployment option based on size, budget, and technical capabilities.

## 📊 Quick Decision Matrix

| Your Situation | Recommended Option | Monthly Cost | Setup Time |
|----------------|-------------------|--------------|------------|
| "Just want to try it out" | Demo Setup | $0 | 30 minutes |
| "Small school, no IT staff" | Managed Cloud | $99-199 | 2 hours |
| "District with IT team" | Self-Hosted | Infrastructure only | 4+ hours |
| "Need maximum control" | Self-Hosted Premium | Infrastructure + support | 4+ hours |

---

## 🎯 Option 1: Demo Setup

**Perfect for**: Individual teachers, pilot programs, small tutoring centers

### What You Get
- ✅ Up to 50 students
- ✅ 1,000 AI messages/month
- ✅ Basic document upload (10MB limit)
- ✅ All safety features
- ✅ 30-day data retention

### Limitations
- ❌ No custom domain
- ❌ Limited to free AI models
- ❌ No email notifications
- ❌ Basic support only

### Setup Requirements
- Any computer with internet
- 30 minutes
- Email address

### Upgrade Path
- Easy migration to Managed Cloud
- Export student data anytime
- Keep all your content

**Total Cost**: $0/month

---

## ☁️ Option 2: Managed Cloud

**Perfect for**: Most schools, districts wanting easy management

### Tiers Available

#### Starter (Up to 100 students)
- **Cost**: $99/month
- **Includes**:
  - Private instance
  - 50GB storage
  - 10,000 AI messages
  - Email support
  - Automatic backups

#### School (100-500 students)
- **Cost**: $199/month
- **Includes**:
  - Everything in Starter
  - 200GB storage
  - 50,000 AI messages
  - Priority support
  - Custom subdomain

#### District (500-2000 students)
- **Cost**: $399/month
- **Includes**:
  - Everything in School
  - 500GB storage
  - 200,000 AI messages
  - Phone support
  - Custom domain
  - SSO integration

#### Enterprise (2000+ students)
- **Cost**: Custom pricing
- **Includes**:
  - Unlimited everything
  - SLA guarantees
  - Dedicated support
  - Custom features

### What's Included in All Managed Plans
- ✅ Setup assistance
- ✅ Automatic updates
- ✅ 99.9% uptime SLA
- ✅ Daily backups
- ✅ Security monitoring
- ✅ Teacher training

### Hidden Costs: None!
- No setup fees
- No per-teacher charges
- AI usage included
- Support included

---

## 🏠 Option 3: Self-Hosted

**Perfect for**: Schools with IT teams, specific compliance needs

### Infrastructure Requirements

#### Minimum (up to 500 students)
```
- Server: 4 vCPUs, 8GB RAM
- Storage: 100GB SSD
- OS: Ubuntu 20.04+ or Docker
- Network: 100Mbps
- SSL certificate
```

#### Recommended (500-2000 students)
```
- Server: 8 vCPUs, 16GB RAM
- Storage: 500GB SSD
- Database: Separate PostgreSQL instance
- Redis: 4GB RAM
- Load balancer
```

#### Enterprise (2000+ students)
```
- Web servers: 3+ instances (load balanced)
- Database: PostgreSQL cluster
- Redis: Cluster mode
- Storage: S3-compatible object storage
- CDN for assets
```

### Cost Breakdown

#### Small School Self-Hosted
| Component | Provider | Monthly Cost |
|-----------|----------|--------------|
| Server | DigitalOcean/Linode | $40 |
| Backup Storage | Backblaze B2 | $5 |
| SSL Certificate | Let's Encrypt | $0 |
| Monitoring | Free tier | $0 |
| **Infrastructure Total** | | **$45** |
| | | |
| OpenRouter API | Usage-based | $50-100 |
| Pinecone | Free tier | $0 |
| OpenAI | Usage-based | $10-20 |
| **Service Total** | | **$60-120** |
| | | |
| **Grand Total** | | **$105-165/month** |

#### Medium School Self-Hosted
| Component | Provider | Monthly Cost |
|-----------|----------|--------------|
| Web Server | AWS/Azure | $100 |
| Database | Managed PostgreSQL | $50 |
| Redis | Managed Redis | $50 |
| Storage | S3/Blob | $20 |
| Backups | Automated | $10 |
| **Infrastructure Total** | | **$230** |
| | | |
| OpenRouter API | Usage-based | $200-400 |
| Pinecone | Standard plan | $70 |
| OpenAI | Usage-based | $20-40 |
| **Service Total** | | **$290-510** |
| | | |
| **Grand Total** | | **$520-740/month** |

### Setup Complexity

1. **Basic Setup** (4-6 hours)
   - Clone repository
   - Configure environment
   - Set up database
   - Configure web server
   - SSL certificates
   - Basic monitoring

2. **Production Setup** (2-3 days)
   - Everything in basic
   - High availability
   - Automated backups
   - Log aggregation
   - Performance tuning
   - Security hardening

3. **Enterprise Setup** (1-2 weeks)
   - Everything in production
   - Multi-region deployment
   - Disaster recovery
   - Compliance controls
   - Custom integrations
   - Load testing

---

## 🔄 Option 4: Hybrid Deployment

**Perfect for**: Schools wanting control with managed services

### What is Hybrid?
- You provide: Infrastructure (servers, network)
- We provide: Deployment, updates, monitoring, support
- Best of both worlds!

### Pricing
- Base fee: $199/month
- Includes:
  - Initial deployment
  - Monthly updates
  - 24/7 monitoring
  - Security patches
  - Configuration management

### Benefits
- ✅ Data stays on your servers
- ✅ No maintenance burden
- ✅ Professional support
- ✅ Automatic updates
- ✅ Cost predictability

---

## 💰 Total Cost Comparison

### Small School (100 students)

| Deployment | Infrastructure | Services | Support | Total/Month |
|------------|---------------|----------|---------|-------------|
| Demo | $0 | $0 | Community | $0 |
| Managed Cloud | Included | Included | Included | $99 |
| Self-Hosted | $45 | $60-120 | DIY | $105-165 |
| Hybrid | $45 | $60-120 | $199 | $304-364 |

### Medium School (500 students)

| Deployment | Infrastructure | Services | Support | Total/Month |
|------------|---------------|----------|---------|-------------|
| Managed Cloud | Included | Included | Included | $199 |
| Self-Hosted | $230 | $290-510 | DIY | $520-740 |
| Hybrid | $230 | $290-510 | $199 | $719-939 |

### Large School (2000 students)

| Deployment | Infrastructure | Services | Support | Total/Month |
|------------|---------------|----------|---------|-------------|
| Managed Cloud | Included | Included | Included | $399 |
| Self-Hosted | $500+ | $500-1000 | DIY | $1000-1500 |
| Hybrid | $500+ | $500-1000 | $299 | $1299-1799 |

---

## 🛠️ Technical Skills Required

### Managed Cloud
- ✅ Can use email
- ✅ Can follow instructions
- ✅ Basic computer skills

### Self-Hosted Minimum
- ✅ Linux command line
- ✅ Web server configuration
- ✅ SSL certificates
- ✅ Basic networking
- ✅ Database basics
- ✅ Troubleshooting skills

### Self-Hosted Recommended
- ✅ Everything above plus:
- ✅ Docker/Kubernetes
- ✅ Load balancing
- ✅ Monitoring systems
- ✅ Security best practices
- ✅ Backup strategies
- ✅ Performance tuning

---

## 🚦 Migration Paths

### Demo → Managed Cloud
- **Effort**: 1 hour
- **Process**: We handle everything
- **Downtime**: None
- **Data preserved**: Yes

### Demo → Self-Hosted
- **Effort**: 4-6 hours
- **Process**: Export/import tools provided
- **Downtime**: During migration
- **Data preserved**: Yes

### Self-Hosted → Managed Cloud
- **Effort**: 2-4 hours
- **Process**: We assist with migration
- **Downtime**: Minimal
- **Data preserved**: Yes

### Managed Cloud → Self-Hosted
- **Effort**: 4-8 hours
- **Process**: Full export provided
- **Downtime**: During migration
- **Data preserved**: Yes

---

## ✅ Decision Checklist

### Choose Demo If:
- [ ] Just exploring options
- [ ] Single classroom pilot
- [ ] No budget approved yet
- [ ] Less than 50 students

### Choose Managed Cloud If:
- [ ] Want to focus on teaching, not IT
- [ ] Need reliable support
- [ ] Have 50-2000 students
- [ ] Want predictable costs
- [ ] No dedicated IT staff

### Choose Self-Hosted If:
- [ ] Have experienced IT team
- [ ] Specific compliance requirements
- [ ] Want full control
- [ ] Can handle maintenance
- [ ] Have existing infrastructure

### Choose Hybrid If:
- [ ] Need on-premise data
- [ ] Want managed services
- [ ] Have infrastructure but not expertise
- [ ] Require SLA guarantees

---

## 📞 Getting Help with Your Decision

### Free Consultation
- Email: sales@opensyllabus.org
- Phone: 1-800-XXX-XXXX
- Video call: Book at opensyllabus.org/demo

### What We'll Discuss
1. Your school's specific needs
2. Current technology setup
3. Budget constraints
4. Growth projections
5. Compliance requirements
6. Recommended approach

### Information to Prepare
- Number of students
- Number of teachers
- Current IT resources
- Budget range
- Timeline for deployment
- Any special requirements

---

## 🌟 Success Stories

### Small Rural School (Demo → Managed)
> "We started with the demo to test with one math class. After seeing 30% improvement in homework completion, we upgraded to Managed Cloud. The setup took 2 hours and we were fully running by Monday." - Principal Johnson, Valley Elementary

### Large Urban District (Self-Hosted)
> "With 5,000 students across 10 schools, we needed full control. Our IT team deployed Open Syllabus on our existing Kubernetes cluster. Total cost is 60% less than proprietary alternatives." - IT Director Chen, Metro School District

### Private School Group (Hybrid)
> "We have the servers but not the expertise. The hybrid model gives us data sovereignty while ensuring the system always works. Worth every penny." - Technology Coordinator Smith, Prestigious Academy Group

---

## 🎯 Next Steps

1. **Review your requirements** using the checklist above
2. **Calculate your costs** using our examples
3. **Book a consultation** if you need guidance
4. **Start with a demo** to test with teachers
5. **Plan your rollout** with our implementation guides

Remember: You can always start small and scale up. Most schools begin with a pilot program in one department before expanding school-wide.

---

*Last updated: January 2025*  
*Questions? Contact deployment@opensyllabus.org*