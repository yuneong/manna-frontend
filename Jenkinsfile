pipeline {
    agent any

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
                    npm run build
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
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