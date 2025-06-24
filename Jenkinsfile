pipeline {
    agent any
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/RinotAndria/Labobine.git'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker-compose -f ${DOCKER_COMPOSE_FILE} build"
            }
        }

        stage('Start Containers') {
            steps {
                sh "docker-compose -f ${DOCKER_COMPOSE_FILE} up -d"
                sh "sleep 10" // Attente simple — tu peux la remplacer par un healthcheck plus tard
            }
        }

        stage('Test') {
            steps {
                // Remplace l'URL interne 'app:3000' par l'URL exposée
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} exec -T app curl -f http://localhost:3000 || exit 1'

            }
        }

        stage('Deploy') {
            steps {
                // Ici, pas besoin de `down` : on reconstruit et relance directement
                sh "docker-compose -f ${DOCKER_COMPOSE_FILE} up -d --build"
            }
        }
    }

    post {
        always {
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} logs"
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} down"
        }

        failure {
            echo 'Le pipeline a échoué. Vérifiez les logs.'
        }
    }
}
