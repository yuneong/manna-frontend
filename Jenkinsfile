pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh '''
                    npm install --legacy-peer-deps
                    npm run build-only
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    rm -rf /var/www/frontend/dist/*
                    cp -r dist/* /var/www/frontend/dist/
                '''
            }
        }
    }

    post {
        success {
            echo '✅ 프론트엔드 배포 성공!'
        }
        failure {
            echo '❌ 프론트엔드 배포 실패!'
        }
    }
}