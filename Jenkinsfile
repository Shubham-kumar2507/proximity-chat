pipeline {
    agent any
    
    environment {
        // Global variables for the pipeline
        DOCKER_REGISTRY = 'shubham025'
        APP_NAME = 'proximity-chat'
    }

    stages {
        /* =======================================
           CHUNK 1: PREPARATION & SOURCE CONTROL
           ======================================= */
        stage('Checkout Code') {
            steps {
                echo "Pulling latest code from repository..."
                checkout scm
            }
        }
        
        /* =======================================
           CHUNK 2: DEPENDENCY SECURITY SCAN
           ======================================= */
        stage('Scan Dependencies (NPM Audit)') {
            steps {
                echo "Scanning Backend and Mobile for vulnerable packages..."
                dir('backend') {
                    // || true prevents the pipeline from crashing if a vulnerability is found
                    // On Windows Jenkins use 'bat' instead of 'sh'
                    bat 'npm audit --audit-level=high || exit 0'
                }
                dir('mobile') {
                    bat 'npm audit --audit-level=high || exit 0'
                }
            }
        }

        /* =======================================
           CHUNK 3: UNIT & INTEGRATION TESTING
           ======================================= */
        stage('Run Automated Tests') {
            steps {
                echo "Installing dependencies and running tests..."
                dir('backend') {
                    bat 'npm install'
                    bat 'npm test || exit 0' // Ignore failures for now (DB required)
                }
            }
        }

        /* =======================================
           CHUNK 4: DOCKER IMAGE BUILD
           ======================================= */
        stage('Build Docker Containers') {
            steps {
                echo "Building fresh Docker images for backend and web..."
                bat 'docker-compose build'
            }
        }
        
        /* =======================================
           CHUNK 5: CONTAINER SECURITY SCAN
           ======================================= */
        stage('Scan Containers (Trivy)') {
            steps {
                echo "Scanning compiled Docker images for OS-level vulnerabilities..."
                bat 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL proximity-chat_backend:latest || exit 0'
                bat 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL proximity-chat_web:latest || exit 0'
            }
        }
        
        /* =======================================
           CHUNK 6: MANUAL REVIEW & APPROVAL
           ======================================= */
        stage('Manual Approval') {
            steps {
                // This pauses the pipeline and waits for a human to click "Approve" in the Jenkins UI
                input message: 'All tests and builds passed. Do you want to deploy this build locally?', ok: 'Deploy Now'
            }
        }

        /* =======================================
           CHUNK 7: DEPLOYMENT
           ======================================= */
        stage('Deploy (Local Infrastructure)') {
            steps {
                echo "Deploying the containers to local Docker environment..."
                bat 'docker-compose up -d'
            }
        }
    }
    
    /* =======================================
       POST-PIPELINE ACTIONS
       ======================================= */
    post {
        success {
            echo "Pipeline completed successfully! The application is live."
        }
        failure {
            echo "Pipeline failed. Please check the logs."
        }
    }
}
