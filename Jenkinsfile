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
                    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                    apt-get install -y nodejs
                    npm ci
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